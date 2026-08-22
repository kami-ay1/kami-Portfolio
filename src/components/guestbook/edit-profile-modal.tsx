"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { AVATARS, avatarLabel, avatarUrl } from "@/data/avatars";
import type { GuestbookProfile } from "@/hooks/use-guestbook";
import { ChatAvatar } from "./avatar";

/**
 * 资料编辑弹窗（对照原项目 EditProfileModal 复刻）：
 * 头像预览 + 名字输入 / 头像九宫格 / 主题色 / 取消-保存。
 * 头像由 DiceBear 根据保存的 seed 在运行时生成，无需本地图片文件。
 */

// 原项目同款 10 色
const COLORS = [
  "#60a5fa", "#f87171", "#4ade80", "#facc15", "#c084fc",
  "#fb923c", "#f43f5e", "#818cf8", "#22d3ee", "#a3e635",
];

export function EditProfileModal({
  isOpen,
  profile,
  onClose,
  onSave,
}: {
  isOpen: boolean;
  profile: GuestbookProfile;
  onClose: () => void;
  onSave: (data: Partial<GuestbookProfile>) => void;
}) {
  const [name, setName] = useState(profile.name);
  const [avatar, setAvatar] = useState(profile.avatar);
  const [color, setColor] = useState(profile.color);

  // 打开时重置为当前资料
  useEffect(() => {
    if (isOpen) {
      setName(profile.name);
      setAvatar(profile.avatar);
      setColor(profile.color);
    }
  }, [isOpen, profile]);

  const save = () => {
    const trimmed = name.trim().slice(0, 24);
    if (trimmed) {
      onSave({ name: trimmed, avatar, color });
      onClose();
    }
  };

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", bounce: 0.2, duration: 0.3 }}
            className="flex h-[600px] max-h-[85vh] w-[400px] max-w-full flex-col rounded-xl border border-border bg-background p-4 text-foreground shadow-2xl ring-1 ring-black/5 dark:border-white/10 dark:bg-[#2b2d31] dark:text-zinc-100 dark:ring-white/10"
            data-no-custom-cursor="true"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 头：预览 + 名字输入 */}
            <div className="mb-4 flex shrink-0 items-center gap-3 border-b border-border pb-3 dark:border-white/10">
              <span
                className="grid size-12 shrink-0 place-items-center rounded-full ring-2 ring-offset-2 ring-offset-background dark:ring-offset-[#2b2d31]"
                style={
                  {
                    "--tw-ring-color": color,
                  } as CSSProperties
                }
              >
                <ChatAvatar
                  name={name}
                  color={color}
                  avatar={avatar}
                  className="size-11"
                />
              </span>
              <div className="min-w-0 flex-1">
                <div className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Edit Profile
                </div>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  maxLength={24}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") save();
                    if (e.key === "Escape") onClose();
                  }}
                  className="w-full rounded-md border-none bg-secondary/50 px-2 py-1 text-base font-semibold outline-none transition-colors focus:bg-secondary dark:bg-white/5 dark:focus:bg-white/10"
                />
              </div>
            </div>

            {/* 头像九宫格（5 列，滚轮滚动，原生滚动条已由 .chat-scroll 隐藏） */}
            <div className="mb-4 flex min-h-0 flex-1 flex-col">
              <div className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Avatar
              </div>
              <div
                data-lenis-prevent
                className="chat-scroll min-h-0 flex-1 overflow-y-auto rounded-lg border border-border bg-secondary/40 dark:border-white/10 dark:bg-black/20"
              >
                <div className="grid grid-cols-5 gap-1.5 p-2">
                  {AVATARS.map((file) => (
                    <button
                      key={file}
                      onClick={() => setAvatar(file)}
                      title={avatarLabel(file)}
                      className={`aspect-square rounded-full p-0.5 transition-all hover:scale-105 ${
                        avatar === file
                          ? "scale-105 bg-[#5865f2] ring-2 ring-[#5865f2]"
                          : "hover:bg-black/10 dark:hover:bg-white/10"
                      }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={avatarUrl(file)!}
                        alt={`Avatar ${file}`}
                        loading="lazy"
                        className="h-full w-full rounded-full object-cover"
                        style={{ backgroundColor: color }}
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 主题色 */}
            <div className="mb-5 shrink-0">
              <div className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Accent Color
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    className={`size-7 rounded-full transition-all hover:scale-110 ${
                      color === c
                        ? "scale-110 shadow-lg ring-2 ring-offset-2 ring-offset-background dark:ring-offset-[#2b2d31]"
                        : ""
                    }`}
                    style={{ backgroundColor: c, "--tw-ring-color": c } as CSSProperties}
                  />
                ))}
              </div>
            </div>

            {/* 操作 */}
            <div className="flex shrink-0 justify-end gap-2 border-t border-border pt-3 dark:border-white/10">
              <button
                onClick={onClose}
                className="h-8 rounded-md px-4 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground dark:hover:bg-white/10 dark:hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={save}
                className="h-8 rounded-md bg-[#5865f2] px-4 text-sm font-medium text-white transition-colors hover:bg-[#4752c4]"
              >
                Save Changes
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
