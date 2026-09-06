"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useLenis } from "lenis/react";

/**
 * Preloader —— 原型 09（kasane 百分比门禁 + 源项目加载条思路）：
 *   - 仅会话内首次访问显示（sessionStorage 门禁）
 *   - 键帽随百分比下压，等宽数字滚动；资源就绪但 <900ms 时也等满再放行，
 *     避免快网闪烁；就绪慢则等 document complete
 *   - 100% → 键帽回弹（回弹曲线）→ 整屏 clip-path 向上擦出（Wipe 0.75s）
 *     → 卸载，键盘 hero 无缝衔接
 *   - 加载期间锁定 Lenis 滚动
 */

const KEY = "preloader-shown";
const MIN_MS = 900;

type Phase = "idle" | "loading" | "bounce" | "wipe" | "done";

export function Preloader() {
  const lenis = useLenis();
  const [phase, setPhase] = useState<Phase>("idle");
  const [pct, setPct] = useState(0);
  // StrictMode 下 effect 会双调用，用 ref 保证门禁只判一次
  const decided = useRef(false);

  // 门禁：会话内只显示一次
  useEffect(() => {
    if (decided.current) return;
    decided.current = true;
    let seen = false;
    try {
      seen = sessionStorage.getItem(KEY) === "1";
    } catch {
      /* 隐私模式等场景下静默跳过 */
    }
    if (seen) {
      setPhase("done");
      return;
    }
    setPhase("loading");
    try {
      sessionStorage.setItem(KEY, "1");
    } catch {
      /* 同上 */
    }
  }, []);

  // 可见期间锁滚动
  useEffect(() => {
    if (phase === "idle" || phase === "done") return;
    lenis?.stop();
    return () => lenis?.start();
  }, [phase, lenis]);

  // 进度：平滑爬到 92%；document complete 且过了最短时长后放行到 100
  useEffect(() => {
    if (phase !== "loading") return;
    const t0 = performance.now();
    let raf = 0;
    const tick = () => {
      const elapsed = performance.now() - t0;
      const ready = document.readyState === "complete";
      const cap =
        ready && elapsed >= MIN_MS
          ? 100
          : Math.min(92, Math.round((elapsed / MIN_MS) * 92));
      setPct((p) => Math.max(p, cap));
      if (cap >= 100) {
        setPhase("bounce");
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase]);

  // 键帽回弹 → 整屏上擦 → 卸载
  useEffect(() => {
    if (phase === "bounce") {
      const t = setTimeout(() => setPhase("wipe"), 480);
      return () => clearTimeout(t);
    }
    if (phase === "wipe") {
      const t = setTimeout(() => setPhase("done"), 780);
      return () => clearTimeout(t);
    }
  }, [phase]);

  if (phase === "idle" || phase === "done") return null;

  return createPortal(
    <div className="pl-root" data-phase={phase} aria-hidden>
      <div className="pl-center">
        <div
          className="pl-key"
          data-phase={phase}
          style={
            phase === "loading"
              ? { transform: `translateY(${pct * 0.13}px)` }
              : undefined
          }
        >
          K
        </div>
        <p className="pl-pct font-mono">Loading {pct}%</p>
      </div>

      <style>{`
.pl-root {
  position: fixed; inset: 0; z-index: 200;
  display: grid; place-items: center;
  background: hsl(var(--background));
  color: hsl(var(--foreground));
  clip-path: inset(0 0 0 0);
  transition: clip-path .75s cubic-bezier(0.76, 0, 0.24, 1);
}
.pl-root[data-phase="wipe"] { clip-path: inset(0 0 100% 0); }
.pl-center { display: grid; justify-items: center; gap: 22px; }
.pl-key {
  width: 92px; height: 92px; border-radius: 20px;
  display: grid; place-items: center;
  background: hsl(var(--secondary));
  border: 1px solid hsl(var(--border));
  box-shadow: 0 9px 0 hsl(var(--border)), 0 24px 48px rgba(0,0,0,.35);
  font-family: var(--font-display), sans-serif;
  font-size: 44px; font-weight: 700; line-height: 1;
  will-change: transform;
}
.pl-key[data-phase="bounce"] {
  animation: pl-pop .48s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}
@keyframes pl-pop {
  from { transform: translateY(13px); }
  to { transform: translateY(0); }
}
.pl-pct {
  font-size: 13px; letter-spacing: .22em;
  color: hsl(var(--muted-foreground));
  font-variant-numeric: tabular-nums;
}
`}</style>
    </div>,
    document.body,
  );
}
