"use client";

import { useEffect, useRef } from "react";
import { useTheme } from "@/components/theme-provider";
import { cn } from "@/lib/utils";
import { usePerfProfile } from "@/hooks/use-perf-profile";

/**
 * 全屏粒子背景（学自原站的视觉，自行实现）。
 *
 * 固定在 -z-10：位于 3D 键盘画布（z-0）和暗色底色之间——
 * 所以 Spline 场景背景必须是透明的，粒子才可见。
 *
 * 效果：白色小点缓慢漂移，靠近视口边缘 20px 内淡出，越界的粒子重生；
 * 鼠标移动时所有粒子按各自"磁性系数"被轻微推挤。
 * 性能：DPR 钳制、标签页隐藏时暂停 rAF、reduced-motion 时不渲染。
 */
type Particle = {
  x: number;
  y: number;
  tx: number; // 鼠标磁性偏移
  ty: number;
  size: number;
  alpha: number;
  targetAlpha: number;
  dx: number;
  dy: number;
  magnetism: number;
};

export function Particles({ className }: { className?: string }) {
  const { particleCount, maxDpr, disableDecorative, ready } = usePerfProfile();
  const { resolvedTheme } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!ready || disableDecorative || particleCount === 0) return;

    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // 粒子颜色随主题：暗色下白点、亮色下深色点（否则亮色白底会隐形）
    const dotColor =
      resolvedTheme === "light" ? "rgba(20, 24, 46," : "rgba(255, 255, 255,";

    const dpr = Math.min(window.devicePixelRatio, maxDpr);
    const size = { w: 0, h: 0 };
    const particles: Particle[] = [];
    const mouse = { x: 0, y: 0 };
    const STATICITY = 50; // 磁性除数：越大越"钝"
    const EASE = 50; // 偏移趋近速度：越大跟随越松
    let raf = 0;

    const spawn = (): Particle => ({
      x: Math.random() * size.w,
      y: Math.random() * size.h,
      tx: 0,
      ty: 0,
      size: Math.random() * 2 + 0.1,
      alpha: 0,
      targetAlpha: Math.random() * 0.6 + 0.1,
      dx: (Math.random() - 0.5) * 0.2,
      dy: (Math.random() - 0.5) * 0.2,
      magnetism: 0.1 + Math.random() * 4,
    });

    const draw = (p: Particle) => {
      ctx.translate(p.tx, p.ty);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = `${dotColor} ${p.alpha})`;
      ctx.fill();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const resize = () => {
      particles.length = 0;
      size.w = container.offsetWidth;
      size.h = container.offsetHeight;
      canvas.width = size.w * dpr;
      canvas.height = size.h * dpr;
      canvas.style.width = `${size.w}px`;
      canvas.style.height = `${size.h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, size.w, size.h);
      for (let i = 0; i < particleCount; i++) particles.push(spawn());
    };

    const frame = () => {
      ctx.clearRect(0, 0, size.w, size.h);
      for (const p of particles) {
        // 距最近边缘不足 20px 时按比例压低透明度，形成柔和的进出淡入淡出
        const edge = Math.min(
          p.x + p.tx - p.size,
          size.w - p.x - p.tx - p.size,
          p.y + p.ty - p.size,
          size.h - p.y - p.ty - p.size
        );
        const fade = Math.max(0, Math.min(1, edge / 20));
        p.alpha =
          fade < 1
            ? p.targetAlpha * fade
            : Math.min(p.targetAlpha, p.alpha + 0.02);

        p.x += p.dx;
        p.y += p.dy;
        // 磁性偏移：目标 = 鼠标位置 / (STATICITY / 磁性)，按 EASE 缓慢趋近
        p.tx += (mouse.x / (STATICITY / p.magnetism) - p.tx) / EASE;
        p.ty += (mouse.y / (STATICITY / p.magnetism) - p.ty) / EASE;

        if (
          p.x < -p.size ||
          p.x > size.w + p.size ||
          p.y < -p.size ||
          p.y > size.h + p.size
        ) {
          Object.assign(p, spawn());
        } else {
          draw(p);
        }
      }
      raf = requestAnimationFrame(frame);
    };

    const onMouseMove = (e: MouseEvent) => {
      // 以视口中心为原点（容器就是全屏 fixed）
      mouse.x = e.clientX - size.w / 2;
      mouse.y = e.clientY - size.h / 2;
    };

    const onVisibility = () => {
      cancelAnimationFrame(raf);
      if (!document.hidden) raf = requestAnimationFrame(frame);
    };

    resize();
    raf = requestAnimationFrame(frame);
    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", onMouseMove, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [ready, disableDecorative, particleCount, maxDpr, resolvedTheme]);

  if (!ready || disableDecorative || particleCount === 0) return null;

  return (
    <div
      ref={containerRef}
      aria-hidden
      className={cn(
        // 微弱对角渐变，随主题切换色（亮色下给白底一点层次）
        "bg-gradient-to-tl from-white via-zinc-400/10 to-white",
        "dark:from-black dark:via-zinc-600/20 dark:to-black",
        className
      )}
    >
      <canvas ref={canvasRef} />
    </div>
  );
}
