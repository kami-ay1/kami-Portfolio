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

const COLORS = [
  "#5865f2", "#57f287", "#fee75c", "#eb459e",
  "#ed4245", "#00b0f4", "#9b59b6", "#e67e22",
];

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
  const profile: GuestbookProfile = {
    name: localStorage.getItem("guestbook:name") || "Guest",
    color:
      localStorage.getItem("guestbook:color") ||
      COLORS[Math.floor(Math.random() * COLORS.length)],
  };
  return { sessionId, profile };
}

export function useGuestbook(isOpen: boolean) {
  const [messages, setMessages] = useState<GuestbookMessage[]>([]);
  const [onlineCount, setOnlineCount] = useState(1);
  const [unreads, setUnreads] = useState(0);
  const [connected, setConnected] = useState(false);
  const [profile, setProfile] = useState<GuestbookProfile>({
    name: "Guest",
    color: COLORS[0],
  });

  const sessionRef = useRef<string>("");
  const profileRef = useRef(profile);
  const lastReadAtRef = useRef<number>(Date.now());
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
      };
      setMessages(data.messages);
      setOnlineCount(data.onlineCount);
      setConnected(true);

      // 未读 = 关闭期间别人发的新消息
      if (!isOpen) {
        const fresh = data.messages.filter(
          (m) =>
            m.createdAt > lastReadAtRef.current &&
            m.sessionId !== sessionRef.current &&
            m.type !== "system"
        );
        setUnreads((prev) => Math.max(prev, fresh.length));
      }
    } catch {
      setConnected(false);
    }
  }, [isOpen]);

  // 轮询（频率随开关状态变化）
  useEffect(() => {
    if (!sessionRef.current) return;
    poll();
    const interval = setInterval(poll, isOpen ? 2500 : 15000);
    return () => clearInterval(interval);
  }, [poll, isOpen]);

  // 打开面板即清未读、标记已读位置
  useEffect(() => {
    if (isOpen) {
      setUnreads(0);
      lastReadAtRef.current = Date.now();
    }
  }, [isOpen]);

  const send = useCallback(async (content: string) => {
    const text = content.trim();
    if (!text || !sessionRef.current || sendingRef.current) return false;
    sendingRef.current = true;
    try {
      const p = profileRef.current;
      const res = await fetch("/api/guestbook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: sessionRef.current,
          name: p.name,
          color: p.color,
          content: text,
        }),
      });
      if (!res.ok) return false;
      await poll();
      lastReadAtRef.current = Date.now();
      return true;
    } catch {
      return false;
    } finally {
      sendingRef.current = false;
    }
  }, [poll]);

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
    unreads,
    connected,
    profile,
    sessionId: sessionRef,
    send,
    updateProfile,
  };
}
