"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { X, SendHorizontal, Loader2, Check, Mail } from "lucide-react";
import { config } from "@/data/config";

/**
 * 联系我弹窗：毛玻璃遮罩 + 缩放入场（motion），字段即时校验，
 * 发送中 loading、成功打勾动画，未配置邮件服务时降级为 mailto 引导。
 * 后端见 src/app/api/contact/route.ts（Resend + zod + IP 限流）。
 */

type Status = "idle" | "sending" | "success" | "error";

const FIELD =
  "w-full rounded-xl border border-border/60 bg-secondary/30 px-4 py-2.5 text-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-foreground/40 focus:bg-secondary/50";

export function ContactModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<Status>("idle");
  const [apiError, setApiError] = useState("");

  // Esc 关闭
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // 成功后 2.4s 自动关闭并复位
  useEffect(() => {
    if (status !== "success") return;
    const t = setTimeout(() => {
      onClose();
      setStatus("idle");
      setName("");
      setEmail("");
      setMessage("");
    }, 2400);
    return () => clearTimeout(t);
  }, [status, onClose]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (name.trim().length < 2) e.name = "姓名至少 2 个字符";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = "邮箱格式不正确";
    if (message.trim().length < 10) e.message = "留言至少 10 个字符";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async () => {
    if (status === "sending" || !validate()) return;
    setStatus("sending");
    setApiError("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `发送失败 (${res.status})`);
      setStatus("success");
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "发送失败");
      setStatus("error");
    }
  };

  // 邮箱未配置（503 email_not_configured）→ 显示 mailto 降级引导
  const notConfigured = apiError.includes("email_not_configured");
  const mailtoHref = `${config.social.email}?subject=${encodeURIComponent(
    `来自个人主页的留言 - ${name}`
  )}&body=${encodeURIComponent(`${message}\n\n— ${name} (${email})`)}`;

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* 遮罩：毛玻璃，点击关闭 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-background/70 backdrop-blur-md"
          />

          {/* 弹窗本体 */}
          <div className="pointer-events-none fixed inset-0 z-50 grid place-items-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ duration: 0.3, ease: [0.21, 0.47, 0.32, 0.98] }}
              role="dialog"
              aria-modal="true"
              aria-label="Contact me"
              className="pointer-events-auto relative w-full max-w-md overflow-hidden rounded-2xl border border-border/60 bg-background shadow-2xl"
            >
              {/* 顶部渐变装饰条 */}
              <div className="h-1 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

              <button
                onClick={onClose}
                aria-label="Close"
                className="absolute right-4 top-4 grid size-8 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                <X className="size-4" />
              </button>

              {status === "success" ? (
                /* 成功态：打勾动画 */
                <div className="flex flex-col items-center px-8 py-14">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className="grid size-16 place-items-center rounded-full bg-green-500/15"
                  >
                    <motion.span
                      initial={{ scale: 0, rotate: -30 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ delay: 0.15, type: "spring" }}
                      className="grid size-9 place-items-center rounded-full bg-green-500 text-white"
                    >
                      <Check className="size-5" />
                    </motion.span>
                  </motion.div>
                  <h3 className="mt-5 font-display text-xl font-bold">
                    发送成功！
                  </h3>
                  <p className="mt-2 text-center text-sm text-muted-foreground">
                    谢谢你的留言，我会尽快回复你。
                  </p>
                </div>
              ) : (
                <div className="p-6 md:p-8">
                  <h3 className="font-display text-2xl font-bold">
                    给我留言
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    填写下面的表单，内容会直接发到我的邮箱。
                  </p>

                  <div className="mt-6 space-y-4">
                    <div>
                      <div className="flex gap-4">
                        <div className="flex-1">
                          <input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="你的名字"
                            maxLength={40}
                            className={`${FIELD} ${
                              errors.name ? "border-red-500/60" : ""
                            }`}
                          />
                          {errors.name && (
                            <p className="mt-1 text-xs text-red-500">
                              {errors.name}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div>
                      <input
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="你的邮箱（方便我回复你）"
                        maxLength={80}
                        className={`${FIELD} ${
                          errors.email ? "border-red-500/60" : ""
                        }`}
                      />
                      {errors.email && (
                        <p className="mt-1 text-xs text-red-500">
                          {errors.email}
                        </p>
                      )}
                    </div>

                    <div>
                      <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="想说的话…（至少 10 个字符）"
                        rows={4}
                        maxLength={2000}
                        className={`${FIELD} resize-none ${
                          errors.message ? "border-red-500/60" : ""
                        }`}
                      />
                      <div className="mt-1 flex justify-between">
                        {errors.message ? (
                          <p className="text-xs text-red-500">
                            {errors.message}
                          </p>
                        ) : (
                          <span />
                        )}
                        <span className="text-xs text-muted-foreground/60">
                          {message.length}/2000
                        </span>
                      </div>
                    </div>

                    {/* 后端错误 / 未配置降级 */}
                    {status === "error" && (
                      <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-500">
                        {notConfigured ? (
                          <div className="space-y-2">
                            <p className="flex items-center gap-2">
                              <Mail className="size-4" />
                            </p>
                            <p>
                              站长还没有配置邮件服务（站点 owners
                              见 README 联系表单一节）。你可以直接发邮件：
                            </p>
                            <a
                              href={mailtoHref}
                              className="inline-flex items-center gap-1.5 font-semibold underline underline-offset-4"
                            >
                              {config.social.email.replace("mailto:", "")}
                            </a>
                          </div>
                        ) : (
                          apiError
                        )}
                      </div>
                    )}

                    <button
                      onClick={submit}
                      disabled={status === "sending"}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground transition-all hover:-translate-y-0.5 hover:shadow-lg disabled:translate-y-0 disabled:opacity-60"
                    >
                      {status === "sending" ? (
                        <>
                          <Loader2 className="size-4 animate-spin" />
                          发送中…
                        </>
                      ) : (
                        <>
                          <SendHorizontal className="size-4" />
                          发送留言
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
