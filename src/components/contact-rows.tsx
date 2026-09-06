"use client";

import { useRef, useState, type ComponentType } from "react";
import { MessageCircle, Smartphone, Mail } from "lucide-react";
import { config } from "@/data/config";

/**
 * Contact 区联系信息行（原型 08）：微信号 / 手机 / 邮箱三行。
 *  - 微信 / 手机：点击复制 → 行尾 "✓ copied" 反馈 1.2s
 *  - 邮箱：整行 mailto
 *  - 入场：行遮罩升起（由 ContactSection 的 trigger 统一驱动 data-c-row）
 */

type Row = {
  id: string;
  k: string;
  v: string;
  icon: ComponentType<{ className?: string }>;
  href?: string;
};

const ROWS: Row[] = [
  { id: "wechat", k: "微信号", v: config.contact.wechat, icon: MessageCircle },
  { id: "phone", k: "手机", v: config.contact.phone, icon: Smartphone },
  {
    id: "email",
    k: "邮箱",
    v: config.contact.email,
    icon: Mail,
    href: `mailto:${config.contact.email}`,
  },
];

export function ContactRows() {
  const [copied, setCopied] = useState<string | null>(null);
  const timer = useRef(0);

  const copy = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    setCopied(id);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(null), 1200);
  };

  return (
    <div className="mx-auto mt-12 w-full max-w-md">
      <style>{`
.cr-shell { overflow: hidden; }
.cr-row {
  display: flex; align-items: center; gap: 12px;
  width: 100%; padding: 13px 18px; border-radius: 12px;
  color: inherit; text-decoration: none; cursor: pointer;
  transition: background-color .4s var(--ease-lando, ease), transform .4s var(--ease-lando, ease);
}
.cr-row:hover { background: rgba(0,0,0,.05); }
.dark .cr-row:hover { background: rgba(255,255,255,.06); }
.cr-ok {
  font-size: 11px; color: #57f287; white-space: nowrap;
  opacity: 0; transform: translateX(6px);
  transition: opacity .3s var(--ease-lando, ease), transform .3s var(--ease-lando, ease);
}
.cr-ok.on { opacity: 1; transform: translateX(0); }
`}</style>
      {ROWS.map((r) => {
        const inner = (
          <>
            <r.icon className="size-4 shrink-0 text-muted-foreground" />
            <span className="w-12 shrink-0 text-left text-xs text-muted-foreground">
              {r.k}
            </span>
            <span className="flex-1 select-all text-left font-mono text-sm font-medium">
              {r.v}
            </span>
            {r.href ? (
              <span className="text-xs text-muted-foreground">mailto ↗</span>
            ) : (
              <span className={`cr-ok ${copied === r.id ? "on" : ""}`}>
                ✓ copied
              </span>
            )}
          </>
        );
        return (
          <div key={r.id} className="cr-shell">
            <div data-c-row style={{ transform: "translateY(110%)" }}>
              {r.href ? (
                <a className="cr-row" href={r.href}>
                  {inner}
                </a>
              ) : (
                <button
                  type="button"
                  className="cr-row"
                  onClick={() => copy(r.id, r.v)}
                >
                  {inner}
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
