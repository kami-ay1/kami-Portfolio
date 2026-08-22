"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * 留言板客户端数据层：身份（sessionId + 昵称/颜色存 localStorage）、
 * 轮询拉取消息与在线人数、发送、未读计数。
 *
 * 轮询频率：面板开着 2.5s（近似实时），关着 15s（维持心跳 + 未读角标）。
 * 想升级成 socket.io 只需要改这个文件。
 */

export type GuestbookMessage = {
  id: string;
  sessionId: string;
  name: string;
  color: string;
  content: string;
  createdAt: number;
  type?: "system";
};

export type GuestbookProfile = { name: string; color: string };

export type OnlineUser = { sessionId: string; name: string; color: string };

const COLORS = [
  "#5865f2", "#57f287", "#fee75c", "#eb459e",
  "#ed4245", "#00b0f4", "#9b59b6", "#e67e22",
];

/** 随机昵称词库：形容词 × 动物 × 编号 ≈ 4 万种组合，小流量下几乎不重名 */
const ADJECTIVES = [
  "Swift", "Cosmic", "Lucky", "Brave", "Calm", "Eager", "Fuzzy", "Gentle",
  "Happy", "Jolly", "Merry", "Nimble", "Plucky", "Quiet", "Rapid", "Silly",
  "Sunny", "Tiny", "Vivid", "Witty",
];
const ANIMALS = [
  "Falcon", "Otter", "Panda", "Tiger", "Koala", "Lynx", "Heron", "Dolphin",
  "Rabbit", "Fox", "Wolf", "Bear", "Hawk", "Crane", "Koi", "Moose",
  "Seal", "Crow", "Gecko", "Ibex",
];
const randomName = () =>
  `${ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)]} ${
    ANIMALS[Math.floor(Math.random() * ANIMALS.length)]
  } ${Math.floor(Math.random() * 99) + 1}`;

const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

function loadIdentity() {
  if (typeof window === "undefined") return null;
  let sessionId = localStorage.getItem("guestbook:session");
  if (!sessionId) {
    sessionId = uid();
    localStorage.setItem("guestbook:session", sessionId);
  }
  // 没起过名字的访客自动分配一个随机昵称并立即持久化（跨访问稳定）
  let name = localStorage.getItem("guestbook:name");
  if (!name) {
    name = randomName();
    localStorage.setItem("guestbook:name", name);
  }
  const profile: GuestbookProfile = {
    name,
    color:
      localStorage.getItem("guestbook:color") ||
      COLORS[Math.floor(Math.random() * COLORS.length)],
  };
  return { sessionId, profile };
}

export function useGuestbook(isOpen: boolean) {
  const [messages, setMessages] = useState<GuestbookMessage[]>([]);
  const [onlineCount, setOnlineCount] = useState(1);
  const [users, setUsers] = useState<OnlineUser[]>([]);
  const [connected, setConnected] = useState(false);
  const [profile, setProfile] = useState<GuestbookProfile>({
    name: "Guest",
    color: COLORS[0],
  });

  const sessionRef = useRef<string>("");
  const profileRef = useRef(profile);
  const sendingRef = useRef(false);

  // 恢复身份（挂载后）
  useEffect(() => {
    const id = loadIdentity();
    if (id) {
      sessionRef.current = id.sessionId;
      setProfile(id.profile);
      profileRef.current = id.profile;
    }
  }, []);

  const poll = useCallback(async () => {
    if (!sessionRef.current) return;
    try {
      const p = profileRef.current;
      const res = await fetch(
        `/api/guestbook?sessionId=${encodeURIComponent(sessionRef.current)}` +
          `&name=${encodeURIComponent(p.name)}&color=${encodeURIComponent(p.color)}`,
        { cache: "no-store" }
      );
      if (!res.ok) throw new Error(String(res.status));
      const data = (await res.json()) as {
        messages: GuestbookMessage[];
        onlineCount: number;
        users?: OnlineUser[];
      };
      setMessages(data.messages);
      setOnlineCount(data.onlineCount);
      if (data.users) setUsers(data.users);
      setConnected(true);
    } catch {
      setConnected(false);
    }
  }, [isOpen]);

  /**
   * 请求策略（省配额设计）：
   *   - 页面加载：拉一次（初始在线人数/历史消息）
   *   - 面板打开：立即拉 + 每 6 秒慢速刷新（聊天可见对方消息 + 心跳维持在线状态）
   *   - 面板关闭：零请求（不烧 Upstash 配额）
   *   - 发送消息后：立即刷新（见 send）
   */
  useEffect(() => {
    if (!sessionRef.current) return;
    poll();
    if (!isOpen) return;
    const interval = setInterval(poll, 6000);
    return () => clearInterval(interval);
  }, [poll, isOpen]);

  /**
   * 发送（乐观更新）：先立刻把消息塞进本地列表让用户零等待，
   * 后台 POST 确认；成功后 poll() 会用服务端真实数据整体替换
   * （临时条目随之消失），失败则把临时条目撤掉并回填输入框。
   */
  const send = useCallback(
    async (content: string) => {
      const text = content.trim();
      if (!text || !sessionRef.current || sendingRef.current) return false;
      sendingRef.current = true;
      const p = profileRef.current;
      const optimistic: GuestbookMessage = {
        id: `tmp-${Date.now()}`,
        sessionId: sessionRef.current,
        name: p.name,
        color: p.color,
        content: text,
        createdAt: Date.now(),
      };
      setMessages((prev) => [...prev, optimistic]);
      try {
        const res = await fetch("/api/guestbook", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId: optimistic.sessionId,
            name: p.name,
            color: p.color,
            content: text,
          }),
        });
        if (!res.ok) {
          setMessages((prev) =>
            prev.filter((m) => m.id !== optimistic.id)
          );
          return false;
        }
        // 用服务端数据整体刷新（临时条目会被自然替换掉）
        await poll();
        return true;
      } catch {
        setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
        return false;
      } finally {
        sendingRef.current = false;
      }
    },
    [poll]
  );

  const updateProfile = useCallback((next: Partial<GuestbookProfile>) => {
    setProfile((prev) => {
      const merged = { ...prev, ...next };
      profileRef.current = merged;
      localStorage.setItem("guestbook:name", merged.name);
      localStorage.setItem("guestbook:color", merged.color);
      return merged;
    });
  }, []);

  return {
    messages,
    onlineCount,
    users,
    connected,
    profile,
    sessionId: sessionRef,
    send,
    updateProfile,
  };
}
