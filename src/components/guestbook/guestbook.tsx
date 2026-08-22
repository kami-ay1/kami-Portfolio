"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { Hash, SendHorizontal, Settings2, UserRound, Users2, X } from "lucide-react";
import { useGuestbook } from "@/hooks/use-guestbook";
import { ChatAvatar } from "./avatar";
import { EditProfileModal } from "./edit-profile-modal";

/** SSR 下退化为 useEffect，避免 useLayoutEffect 的服务端警告 */
const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

/**
 * 顶栏留言板（对照原项目 OnlineUsers 按钮复刻）：
 *   - 用户图标 + 在线人数角标；有未读时角标变绿、按钮脉冲 + 扩散波纹
 *   - ≥2 人在线且面板关闭时，浮现 "N people here" 标签
 *   - Ctrl+/ 快捷开关；Esc / 点击面板外关闭
 *   - 面板：#general 频道头（连接状态点 + 在线人数）、消息列表（头像/昵称/
 *     系统加入提示）、输入框；点头像或在线名单里的自己 → 资料编辑弹窗
 *     （自定义昵称/头像/主题色，存 localStorage；头像为本地文件，
 *     见 scripts/generate-avatars.mjs 与 src/data/avatars.ts）
 *
 * 与原项目的差异：实时层由独立 Socket.io 服务换成了 API 路由 + 轮询
 * （见 src/app/api/guestbook/route.ts），功能语义一致、无需额外后端。
 */

const time = (ts: number) =>
  new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

export function Guestbook() {
  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const [showUserList, setShowUserList] = useState(false);
  /** Portal 需要 document，SSR/首帧时不可用 */
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const { messages, onlineCount, users, connected, profile, sessionId, send, updateProfile } =
    useGuestbook(isOpen);

  const listRef = useRef<HTMLDivElement>(null);
  const atBottomRef = useRef(true);
  const wasOpenRef = useRef(false);
  const dragRef = useRef<{ startY: number; startScrollTop: number } | null>(null);
  const [scrollThumb, setScrollThumb] = useState({ top: 0, height: 0, visible: false });

  const updateScrollThumb = useCallback(() => {
    const el = listRef.current;
    if (!el) return;

    const maxScroll = el.scrollHeight - el.clientHeight;
    if (maxScroll <= 0) {
      setScrollThumb({ top: 0, height: 0, visible: false });
      return;
    }

    const height = Math.max(32, (el.clientHeight * el.clientHeight) / el.scrollHeight);
    const maxTop = el.clientHeight - height;
    setScrollThumb({
      top: (el.scrollTop / maxScroll) * maxTop,
      height,
      visible: true,
    });
  }, []);

  // Ctrl+/ 开关（原项目同款快捷键）
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "/") {
        e.preventDefault();
        setIsOpen((v) => !v);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  // Esc 关闭（资料弹窗开着时优先只关弹窗，弹窗内部自己处理 Esc）
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !editOpen) setIsOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, editOpen]);

  // 新消息时保持贴底（原本就在底部才跟随）。
  // 必须用 layout effect：在浏览器绘制之前执行滚动定位，
  // 否则会先画出"顶部"一帧再跳到底部，用户看到滚动过程
  useIsoLayoutEffect(() => {
    if (!isOpen) {
      wasOpenRef.current = false;
      return;
    }

    const el = listRef.current;
    const openedNow = !wasOpenRef.current;
    wasOpenRef.current = true;
    if (el && (openedNow || atBottomRef.current)) el.scrollTop = el.scrollHeight;
    updateScrollThumb();
  }, [isOpen, messages, updateScrollThumb]);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const resizeObserver = new ResizeObserver(updateScrollThumb);
    resizeObserver.observe(el);
    updateScrollThumb();
    return () => resizeObserver.disconnect();
  }, [isOpen, updateScrollThumb]);

  const onListScroll = () => {
    const el = listRef.current;
    if (!el) return;
    atBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
    updateScrollThumb();
  };

  const startThumbDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = listRef.current;
    if (!el) return;
    e.preventDefault();
    dragRef.current = { startY: e.clientY, startScrollTop: el.scrollTop };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const dragThumb = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = listRef.current;
    const drag = dragRef.current;
    if (!el || !drag || scrollThumb.height === 0) return;

    const maxScroll = el.scrollHeight - el.clientHeight;
    const maxThumbTop = el.clientHeight - scrollThumb.height;
    el.scrollTop = drag.startScrollTop + ((e.clientY - drag.startY) / maxThumbTop) * maxScroll;
  };

  const stopThumbDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    dragRef.current = null;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };

  const submit = async () => {
    const text = draft;
    if (!text.trim()) return;
    setDraft(""); // 立即清空（乐观），失败在下面回填
    const ok = await send(text);
    if (!ok) setDraft(text);
  };

  return (
    <>
      {/* 按钮区："N people here" 标签（不吃填色）+ 图标按钮（悬浮拉宽露出 let's chat） */}
      <div className="pointer-events-auto flex items-center gap-2">
        {!isOpen && (
          <span className="hidden select-none whitespace-nowrap text-xs font-medium text-muted-foreground md:block">
            {onlineCount} {onlineCount === 1 ? "person" : "people"} here
          </span>
        )}

        <button
          aria-label={isOpen ? "Close chat" : "Open chat"}
          title="Chat (Ctrl+/)"
          onClick={() => setIsOpen((v) => !v)}
          className="btn-fill group relative flex h-10 items-center rounded-lg px-2.5 transition-colors"
        >
          <Users2 className="size-5 shrink-0" />
          {/* 悬浮拉宽：max-w 0→96 露出文字，文字自身 overflow-hidden 裁剪 */}
          <span className="max-w-0 overflow-hidden whitespace-nowrap text-xs font-semibold leading-none opacity-0 transition-all duration-500 ease-[cubic-bezier(0.65,0.05,0.35,1)] group-hover:ml-2 group-hover:max-w-24 group-hover:opacity-100">
            let&apos;s chat
          </span>
          <span className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-red-500 text-[10px] font-bold text-white transition-colors">
            {onlineCount}
          </span>
        </button>
      </div>

      {mounted &&
        createPortal(
          <>
            {/* 面板外透明捕获层：点击关闭。
                必须 Portal 到 body：顶栏有 backdrop-blur（backdrop-filter），
                它会成为内部 fixed 元素的包含块，导致这个 inset-0 层
                实际只盖住 64px 的顶栏条而不是全屏 */}
            <AnimatePresence>
              {isOpen && (
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setIsOpen(false)}
                />
              )}
            </AnimatePresence>

            {/* 聊天面板（顶栏右下方，深色 Discord 风——原项目同款）。
                同样 Portal 出去，摆脱顶栏包含块，fixed 定位锚回视口 */}
            <AnimatePresence>
              {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 8, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.98 }}
          transition={{ duration: 0.2 }}
          data-no-custom-cursor="true"
          className="pointer-events-auto fixed right-4 top-16 z-40 flex h-[440px] w-80 flex-col overflow-hidden rounded-xl border border-border bg-background text-foreground shadow-2xl dark:border-white/10 dark:bg-[#0b0b0e] dark:text-zinc-100 sm:w-96"
        >
            {/* 频道头 */}
            <div className="flex h-12 shrink-0 items-center justify-between border-b border-border px-4 dark:border-white/10">
              <div className="flex items-center gap-2 font-semibold">
                <Hash className="size-4 text-muted-foreground" />
                <span>general</span>
                {/* 连接状态点 */}
                <span className="ml-1 flex items-center gap-1.5">
                  <span
                    className={`size-2 rounded-full ${
                      connected ? "bg-green-500" : "animate-pulse bg-yellow-500"
                    }`}
                  />
                  {!connected && (
                    <span className="text-[10px] font-normal text-muted-foreground">
                      connecting…
                    </span>
                  )}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setEditOpen(true)}
                  title="Edit profile"
                  className="relative grid size-8 place-items-center rounded-full transition-colors hover:bg-secondary dark:hover:bg-white/10"
                >
                  <ChatAvatar
                    name={profile.name}
                    color={profile.color}
                    avatar={profile.avatar}
                    className="size-7"
                  />
                  <Settings2 className="absolute size-3 translate-x-3 translate-y-3 text-white/80" />
                </button>
                <button
                  onClick={() => setShowUserList((v) => !v)}
                  title="Online users"
                  className={`flex items-center gap-1 rounded-md px-2 py-1 text-xs transition-colors ${
                    showUserList
                      ? "bg-secondary text-foreground dark:bg-white/10 dark:text-white"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground dark:text-zinc-300 dark:hover:bg-white/10 dark:hover:text-white"
                  }`}
                >
                  <span className="size-2 rounded-full bg-green-500" />
                  {onlineCount}
                  <UserRound className="size-4" />
                </button>
              </div>
            </div>

            {/* 在线名单浮层：点头部的计数按钮开关（原项目 UserList 同款位置） */}
            <AnimatePresence>
              {showUserList && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="absolute inset-0 z-20 flex flex-col bg-background/95 backdrop-blur-sm dark:bg-[#0b0b0e]/95"
                >
                  <div className="flex h-12 shrink-0 items-center justify-between border-b border-border px-4 dark:border-white/10">
                    <span className="text-sm font-semibold">
                      Online — {users.length}
                    </span>
                    <button
                      onClick={() => setShowUserList(false)}
                      aria-label="Close user list"
                      className="grid size-7 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground dark:hover:bg-white/10 dark:hover:text-white"
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                  <ul className="chat-scroll flex-1 space-y-1 overflow-y-auto p-2">
                    {users.map((u) => {
                      const isMe = u.sessionId === sessionId.current;
                      return (
                        <li key={u.sessionId}>
                          <button
                            onClick={() => {
                              // 点自己 → 打开资料编辑弹窗
                              if (isMe) {
                                setEditOpen(true);
                                setShowUserList(false);
                              }
                            }}
                            className="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-secondary/60 dark:hover:bg-white/5"
                          >
                            <span className="relative shrink-0">
                              <ChatAvatar
                                name={u.name}
                                color={u.color}
                                avatar={u.avatar}
                                className="size-8"
                              />
                              <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full border-2 border-background bg-green-500 dark:border-[#0b0b0e]" />
                            </span>
                            <span className="truncate text-sm font-medium">
                              {u.name}
                            </span>
                            {isMe && (
                              <span className="ml-auto rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold text-muted-foreground dark:bg-white/10 dark:text-zinc-300">
                                You
                              </span>
                            )}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </motion.div>
              )}
            </AnimatePresence>

            {/* 消息列表 */}
            <div className="relative min-h-0 flex-1">
              <div
                ref={listRef}
                onScroll={onListScroll}
                data-lenis-prevent
                className="chat-scroll h-full space-y-3 overflow-y-auto px-4 py-3"
              >
                {messages.length === 0 && (
                  <div className="grid h-full place-items-center text-center text-sm text-muted-foreground">
                    <div>
                      <p className="text-2xl">👋</p>
                      <p className="mt-2">Welcome to #general</p>
                      <p className="text-xs">Be the first to say hi!</p>
                    </div>
                  </div>
                )}
                {messages.map((m) =>
                  m.type === "system" ? (
                    <p key={m.id} className="text-center text-xs text-muted-foreground">
                      — {m.name} joined —
                    </p>
                  ) : (
                    <div key={m.id} className="flex gap-2.5">
                      <ChatAvatar
                        name={m.name}
                        color={m.color}
                        avatar={m.avatar}
                        className="mt-0.5 size-8"
                      />
                      <div className="min-w-0">
                        <p className="flex items-baseline gap-2">
                          <span className="truncate text-sm font-semibold">{m.name}</span>
                          <span className="shrink-0 text-[10px] text-muted-foreground/70 dark:text-zinc-500">
                            {time(m.createdAt)}
                          </span>
                        </p>
                        <p className="break-words text-sm leading-snug text-muted-foreground dark:text-zinc-300">
                          {m.content}
                        </p>
                      </div>
                    </div>
                  )
                )}
              </div>
              {scrollThumb.visible && (
                <div
                  aria-hidden="true"
                  onPointerDown={startThumbDrag}
                  onPointerMove={dragThumb}
                  onPointerUp={stopThumbDrag}
                  onPointerCancel={stopThumbDrag}
                  className="chat-scroll-thumb absolute right-1 top-0 z-10 w-1.5"
                  style={{ height: scrollThumb.height, transform: `translateY(${scrollThumb.top}px)` }}
                />
              )}
            </div>

            {/* 输入框 */}
            <div className="shrink-0 p-3">
              <div className="flex items-center gap-2 rounded-lg bg-secondary/40 ring-1 ring-border focus-within:ring-foreground/30 dark:bg-black/40 dark:ring-white/10 dark:focus-within:ring-white/30">
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && submit()}
                  maxLength={500}
                  placeholder="Message #general"
                  className="min-w-0 flex-1 bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground/60"
                />
                <button
                  onClick={submit}
                  disabled={!draft.trim()}
                  aria-label="Send message"
                  className="mr-1.5 grid size-8 shrink-0 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-40 dark:hover:bg-white/10 dark:hover:text-white"
                >
                  <SendHorizontal className="size-4" />
                </button>
              </div>
            </div>
                </motion.div>
              )}
            </AnimatePresence>
          </>,
          document.body
        )}

      {/* 资料编辑弹窗（自带 Portal，居中覆盖全屏） */}
      <EditProfileModal
        isOpen={editOpen}
        profile={profile}
        onClose={() => setEditOpen(false)}
        onSave={updateProfile}
      />
    </>
  );
}
