"use client";

import { useEffect, useRef } from "react";

/**
 * 滚动指示条（lusion.co 同款）：
 *   - 右缘细轨道 + 深色滑块，滑块高度按「视口 / 文档高度」比例、位置按滚动进度
 *   - 平时隐藏；滚动动作出现，停止约 1.1s 后淡出（Lando 曲线）
 *   - 直接读 window.scrollY（Lenis 滚动的是原生滚动位置），只写 ref 不触发重渲染
 *   - 移动端隐藏（触屏本身用系统滚动条语义）
 */
export function ScrollProgress() {
  const rootRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);
  const hideT = useRef(0);

  useEffect(() => {
    const update = () => {
      const root = rootRef.current;
      const thumb = thumbRef.current;
      if (!root || !thumb) return;
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      const trackH = root.clientHeight;
      const thumbH = Math.min(120, Math.max(36, trackH * (window.innerHeight / doc.scrollHeight)));
      const y = max > 0 ? (window.scrollY / max) * (trackH - thumbH) : 0;
      thumb.style.height = `${thumbH}px`;
      thumb.style.transform = `translate(-50%, ${y}px)`;
      root.style.opacity = "1";
      window.clearTimeout(hideT.current);
      hideT.current = window.setTimeout(() => {
        root.style.opacity = "0";
      }, 1100);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      window.clearTimeout(hideT.current);
    };
  }, []);

  return (
    <div
      ref={rootRef}
      aria-hidden
      className="sp-root pointer-events-none fixed right-[9px] top-1/2 z-[25] h-[260px] w-[4px] -translate-y-1/2"
      style={{ opacity: 0 }}
    >
      <div className="sp-track absolute inset-0 rounded-full" />
      <div
        ref={thumbRef}
        className="sp-thumb absolute left-1/2 top-0 w-[6px] rounded-full"
      />
      <style>{`
.sp-root { transition: opacity .6s cubic-bezier(0.65,0.05,0.35,1); }
.sp-track { background: hsl(var(--foreground) / .18); }
/* 滑块比轨道更宽、盖在轨道上（对照 lusion：黑胶囊压浅灰轨道） */
.sp-thumb { background: hsl(var(--foreground)); box-shadow: 0 0 0 1px hsl(var(--background) / .6); }
@media (max-width: 767px) { .sp-root { display: none; } }
`}</style>
    </div>
  );
}
