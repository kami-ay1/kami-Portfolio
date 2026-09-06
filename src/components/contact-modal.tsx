"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { X, Check, Mail } from "lucide-react";
import { config } from "@/data/config";

/**
 * 联系我弹窗 —— 原型 08 重设计（仅 UI 层，功能不变）：
 *   - 橄榄色单色细条顶栏（替代彩虹渐变）
 *   - 下划线式输入框：label 浮动，聚焦底线从左向右展开（Lando 0.4s）
 *   - 校验失败：底线变红 + 错误文案行遮罩升起
 *   - 发送中：文字淡出 + 三点跳动；成功：✓ 回弹打勾（表单擦出）
 *   - 字数计数器右下角常显；Esc / 点遮罩关闭；系统光标区
 *   后端见 src/app/api/contact/route.ts（Resend + zod + IP 限流）。
 */

type Status = "idle" | "sending" | "success" | "error";

/** 下划线字段：placeholder=" " 是浮动 label 的 CSS 钩子（:not(:placeholder-shown)） */
function Field({
  id,
  label,
  value,
  onChange,
  error,
  textarea,
  maxLength,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  textarea?: boolean;
  maxLength: number;
}) {
  const cls = `cf-input ${error ? "cf-err-on" : ""}`;
  return (
    <div className={`cf-field ${error ? "cf-err-on" : ""}`}>
      {textarea ? (
        <textarea
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder=" "
          rows={4}
          maxLength={maxLength}
          className={`${cls} resize-none`}
        />
      ) : (
        <input
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder=" "
          maxLength={maxLength}
          className={cls}
        />
      )}
      <label htmlFor={id} className="cf-label">
        {label}
      </label>
      <i className="cf-accent" aria-hidden />
      <em className="cf-err" aria-live="polite">
        <span>{error ?? ""}</span>
      </em>
    </div>
  );
}

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
    if (message.trim().length < 10) e.message = "想说点什么呢（至少 10 个字符）";
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
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-background/70 backdrop-blur-md"
          />

          <div className="pointer-events-none fixed inset-0 z-50 grid place-items-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ duration: 0.3, ease: [0.65, 0.05, 0.35, 1] }}
              role="dialog"
              aria-modal="true"
              aria-label="给我留言"
              data-no-custom-cursor="true"
              className="pointer-events-auto relative w-full max-w-md overflow-hidden rounded-2xl border border-border/60 bg-background shadow-2xl"
            >
              {/* 顶部：橄榄色单色细条（原型规格） */}
              <div className="h-[3px] w-full bg-[#8f937f]" />

              <button
                onClick={onClose}
                aria-label="Close"
                className="absolute right-4 top-4 grid size-8 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                <X className="size-4" />
              </button>

              {status === "success" ? (
                /* 成功态：表单擦出后 ✓ 回弹打勾 */
                <div className="flex flex-col items-center px-8 py-16">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{
                      type: "spring",
                      stiffness: 320,
                      damping: 16,
                      mass: 0.9,
                    }}
                    className="grid size-16 place-items-center rounded-full bg-[#57f287]/15"
                  >
                    <motion.span
                      initial={{ scale: 0, rotate: -30 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{
                        delay: 0.12,
                        type: "spring",
                        stiffness: 380,
                        damping: 14,
                      }}
                      className="grid size-9 place-items-center rounded-full bg-[#57f287] text-[#101014]"
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
                  <h3 className="font-display text-2xl font-bold">给我留言</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    填写下面的表单，内容会直接发到我的邮箱。
                  </p>

                  <style>{`
/* ---- 下划线式字段（原型 08 规格） ---- */
.cf-field { position: relative; padding-top: 20px; margin-top: 14px; }
.cf-input {
  width: 100%; background: transparent; border: 0; outline: none;
  border-bottom: 1px solid rgba(128,128,128,.35);
  padding: 6px 2px; font-size: 14px; color: inherit;
}
.cf-input:focus { border-bottom-color: transparent; }
.cf-label {
  position: absolute; left: 2px; top: 26px;
  font-size: 14px; color: var(--muted-foreground, #9b9b8f);
  pointer-events: none;
  transition: top .3s cubic-bezier(0.65,0.05,0.35,1), font-size .3s cubic-bezier(0.65,0.05,0.35,1);
}
.cf-input:focus ~ .cf-label,
.cf-input:not(:placeholder-shown) ~ .cf-label { top: 0; font-size: 11px; }
.cf-accent {
  position: absolute; left: 0; right: 0; bottom: 21px; height: 2px;
  background: #8f937f;
  transform: scaleX(0); transform-origin: left;
  transition: transform .4s cubic-bezier(0.65,0.05,0.35,1), background-color .3s;
}
.cf-field:focus-within .cf-accent { transform: scaleX(1); }
.cf-field.cf-err-on .cf-accent { transform: scaleX(1); background: #ef4444; }
.cf-err {
  display: block; height: 18px; margin-top: 3px;
  font-size: 11px; font-style: normal; color: #ef4444;
  overflow: hidden;
}
.cf-err span {
  display: block; transform: translateY(110%);
  transition: transform .35s cubic-bezier(0.65,0.05,0.35,1);
}
.cf-field.cf-err-on .cf-err span { transform: translateY(0); }
/* ---- 发送中三点 ---- */
.cf-dots { display: inline-flex; gap: 6px; }
.cf-dots i {
  width: 6px; height: 6px; border-radius: 50%; background: currentColor;
  animation: cf-dot 1s ease-in-out infinite alternate;
}
.cf-dots i:nth-child(2) { animation-delay: .16s; }
.cf-dots i:nth-child(3) { animation-delay: .32s; }
@keyframes cf-dot { from { transform: translateY(0); opacity: .4; } to { transform: translateY(-5px); opacity: 1; } }
`}</style>

                  <div>
                    <Field
                      id="cf-name"
                      label="你的名字"
                      value={name}
                      onChange={setName}
                      error={errors.name}
                      maxLength={40}
                    />
                    <Field
                      id="cf-email"
                      label="邮箱（方便我回复你）"
                      value={email}
                      onChange={setEmail}
                      error={errors.email}
                      maxLength={80}
                    />
                    <div className="relative">
                      <Field
                        id="cf-msg"
                        label="想说的话"
                        value={message}
                        onChange={setMessage}
                        error={errors.message}
                        textarea
                        maxLength={500}
                      />
                      <span className="pointer-events-none absolute bottom-6 right-0 text-[11px] text-muted-foreground/60">
                        {message.length}/500
                      </span>
                    </div>

                    {/* 后端错误 / 未配置降级 */}
                    {status === "error" && (
                      <div className="mt-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-500">
                        {notConfigured ? (
                          <div className="space-y-2">
                            <p className="flex items-center gap-2">
                              <Mail className="size-4" />
                            </p>
                            <p>站长还没有配置邮件服务。你可以直接发邮件：</p>
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
                      className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3.5 text-sm font-semibold text-primary-foreground transition-all hover:opacity-90 disabled:opacity-60"
                    >
                      {status === "sending" ? (
                        <span className="cf-dots" aria-label="发送中">
                          <i />
                          <i />
                          <i />
                        </span>
                      ) : (
                        "发送留言"
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
