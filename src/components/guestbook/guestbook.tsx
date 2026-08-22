"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Hash, SendHorizontal, Settings2, Users2 } from "lucide-react";
import { useGuestbook } from "@/hooks/use-guestbook";

/**
 * 顶栏留言板（对照原项目 OnlineUsers 按钮复刻）：
 *   - 用户图标 + 在线人数角标；有未读时角标变绿、按钮脉冲 + 扩散波纹
 *   - ≥2 人在线且面板关闭时，浮现 "N people here" 标签
 *   - Ctrl+/ 快捷开关；Esc / 点击面板外关闭
 *   - 面板：#general 频道头（连接状态点 + 在线人数）、消息列表（头像/昵称/
 *     系统加入提示）、输入框、昵称与颜色编辑（存 localStorage）
 *
 * 与原项目的差异：实时层由独立 Socket.io 服务换成了 API 路由 + 轮询
 * （见 src/app/api/guestbook/route.ts），功能语义一致、无需额外后端。
 */

const time = (ts: number) =>
  new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

const COLOR_CHOICES = [
  "#5865f2", "#57f287", "#fee75c", "#eb459e",
  "#ed4245", "#00b0f4", "#9b59b6", "#e67e22",
];

export function Guestbook() {
  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [editingProfile, setEditingProfile] = useState(false);
  const [nameDraft, setNameDraft] = useState("");

  const { messages, onlineCount, unreads, connected, profile, send, updateProfile } =
    useGuestbook(isOpen);

  const listRef = useRef<HTMLDivElement>(null);
  const atBottomRef = useRef(true);

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

  // Esc 关闭
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !editingProfile) setIsOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, editingProfile]);

  // 新消息时保持贴底（原本就在底部才跟随）
  useEffect(() => {
    const el = listRef.current;
    if (el && atBottomRef.current) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const onListScroll = () => {
    const el = listRef.current;
    if (!el) return;
    atBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
  };

  const submit = async () => {
    if (!draft.trim()) return;
    const ok = await send(draft);
    if (ok) setDraft("");
  };

  const saveProfile = () => {
    const name = nameDraft.trim().slice(0, 24) || "Guest";
    updateProfile({ name });
    setEditingProfile(false);
  };

  return (
    <>
      {/* 按钮区："N people here" 标签 + 图标按钮（原项目同款） */}
      <div className="pointer-events-auto flex items-center gap-2">
        <AnimatePresence>
          {onlineCount >= 2 && !isOpen && (
            <motion.span
              initial={{ opacity: 0, x: 5 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 5 }}
              className="hidden select-none whitespace-nowrap text-xs font-medium text-muted-foreground md:block"
            >
              {onlineCount} people here
            </motion.span>
          )}
        </AnimatePresence>

        <button
          aria-label={isOpen ? "Close chat" : "Open chat"}
          title="Chat (Ctrl+/)"
          onClick={() => setIsOpen((v) => !v)}
          className={`relative grid size-10 place-items-center rounded-lg border-2 backdrop-blur-sm transition-all duration-300 ${
            unreads > 0 && !isOpen
              ? "animate-pulse border-green-500/50"
              : "border-border/30"
          }`}
        >
          <span className="relative">
            {/* 未读时的扩散波纹（原项目同款） */}
            <motion.span
              initial={{ scale: 0.1, opacity: 1 }}
              animate={{ scale: 2, opacity: 0 }}
              transition={{
                duration: 0.4,
                ease: "easeOut",
                repeat: Infinity,
                repeatDelay: 2,
              }}
              className={`absolute -inset-1 rounded-full ${
                unreads > 0 ? "bg-green-500/40" : "bg-transparent"
              }`}
            />
            <Users2 className="relative size-5" />
          </span>
          <span
            className={`absolute -right-1 -top-1 grid size-5 place-items-center rounded-full text-[10px] font-bold text-white transition-colors ${
              unreads > 0 ? "bg-green-500" : "bg-red-500"
            }`}
          >
            {unreads > 0 ? unreads : onlineCount}
          </span>
        </button>
      </div>

      {/* 面板外透明捕获层：点击关闭（等价于原项目 Popover 的外部点击关闭） */}
      <AnimatePresence>
        {isOpen && (
          <div
            className="fixed inset-0 z-[2]"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* 聊天面板（顶栏右下方，深色 Discord 风——原项目同款） */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="pointer-events-auto fixed right-4 top-16 z-[3] flex h-[440px] w-80 flex-col overflow-hidden rounded-xl border border-white/10 bg-[#0b0b0e] text-zinc-100 shadow-2xl sm:w-96"
          >
            {/* 频道头 */}
            <div className="flex h-12 shrink-0 items-center justify-between border-b border-white/10 px-4">
              <div className="flex items-center gap-2 font-semibold">
                <Hash className="size-4 text-zinc-400" />
                <span>general</span>
                {/* 连接状态点 */}
                <span className="ml-1 flex items-center gap-1.5">
                  <span
                    className={`size-2 rounded-full ${
                      connected ? "bg-green-500" : "animate-pulse bg-yellow-500"
                    }`}
                  />
                  {!connected && (
                    <span className="text-[10px] font-normal text-zinc-400">
                      connecting…
                    </span>
                  )}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setNameDraft(profile.name);
                    setEditingProfile((v) => !v);
                  }}
                  title="Edit profile"
                  className="grid size-8 place-items-center rounded-full transition-colors hover:bg-white/10"
                >
                  <span
                    className="grid size-7 place-items-center rounded-full text-xs font-bold text-white ring-1 ring-white/20"
                    style={{ backgroundColor: profile.color }}
                  >
                    {profile.name[0]?.toUpperCase()}
                    <Settings2 className="absolute size-3 translate-x-3 translate-y-3 text-white/80" />
                  </span>
                </button>
                <span className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-zinc-300">
                  <span className="size-2 rounded-full bg-green-500" />
                  {onlineCount}
                </span>
              </div>
            </div>

            {/* 资料编辑（昵称 + 颜色，存 localStorage） */}
            <AnimatePresence>
              {editingProfile && (
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: "auto" }}
                  exit={{ height: 0 }}
                  className="overflow-hidden border-b border-white/10 bg-white/5"
                >
                  <div className="space-y-2 p-3">
                    <input
                      value={nameDraft}
                      onChange={(e) => setNameDraft(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && saveProfile()}
                      maxLength={24}
                      placeholder="Your name"
                      className="w-full rounded-md bg-black/40 px-2 py-1.5 text-sm outline-none ring-1 ring-white/10 focus:ring-white/30"
                    />
                    <div className="flex items-center justify-between">
                      <div className="flex gap-1.5">
                        {COLOR_CHOICES.map((c) => (
                          <button
                            key={c}
                            onClick={() => updateProfile({ color: c })}
                            className={`size-5 rounded-full transition-transform hover:scale-110 ${
                              profile.color === c
                                ? "ring-2 ring-white ring-offset-2 ring-offset-[#0b0b0e]"
                                : ""
                            }`}
                            style={{ backgroundColor: c }}
                          />
                        ))}
                      </div>
                      <button
                        onClick={saveProfile}
                        className="rounded-md bg-[#5865f2] px-3 py-1 text-xs font-semibold text-white hover:bg-[#4752c4]"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* 消息列表 */}
            <div
              ref={listRef}
              onScroll={onListScroll}
              className="flex-1 space-y-3 overflow-y-auto px-4 py-3"
            >
              {messages.length === 0 && (
                <div className="grid h-full place-items-center text-center text-sm text-zinc-500">
                  <div>
                    <p className="text-2xl">👋</p>
                    <p className="mt-2">Welcome to #general</p>
                    <p className="text-xs">Be the first to say hi!</p>
                  </div>
                </div>
              )}
              {messages.map((m) =>
                m.type === "system" ? (
                  <p
                    key={m.id}
                    className="text-center text-xs text-zinc-500"
                  >
                    — {m.name} joined —
                  </p>
                ) : (
                  <div key={m.id} className="flex gap-2.5">
                    <span
                      className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-full text-xs font-bold text-white"
                      style={{ backgroundColor: m.color }}
                    >
                      {m.name[0]?.toUpperCase()}
                    </span>
                    <div className="min-w-0">
                      <p className="flex items-baseline gap-2">
                        <span className="truncate text-sm font-semibold">
                          {m.name}
                        </span>
                        <span className="shrink-0 text-[10px] text-zinc-500">
                          {time(m.createdAt)}
                        </span>
                      </p>
                      <p className="break-words text-sm leading-snug text-zinc-300">
                        {m.content}
                      </p>
                    </div>
                  </div>
                )
              )}
            </div>

            {/* 输入框 */}
            <div className="shrink-0 p-3">
              <div className="flex items-center gap-2 rounded-lg bg-black/40 ring-1 ring-white/10 focus-within:ring-white/30">
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && submit()}
                  maxLength={500}
                  placeholder="Message #general"
                  className="min-w-0 flex-1 bg-transparent px-3 py-2 text-sm outline-none placeholder:text-zinc-500"
                />
                <button
                  onClick={submit}
                  disabled={!draft.trim()}
                  aria-label="Send message"
                  className="mr-1.5 grid size-8 shrink-0 place-items-center rounded-md text-zinc-400 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-40"
                >
                  <SendHorizontal className="size-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
