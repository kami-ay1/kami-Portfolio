"use client";

import { useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { flushSync } from "react-dom";
import { usePerfProfile } from "@/hooks/use-perf-profile";

/**
 * 主题切换按钮 —— 圆形扩散动效（学自原站）。
 *
 * 用 View Transitions API：浏览器对整页拍"旧/新"两张快照，我们在
 * ::view-transition-new(root) 伪元素上做一个从按钮位置扩开的圆形 clip-path，
 * 新主题就像圆形波纹一样从按钮处涌出盖满全屏（500ms）。
 * 不支持该 API（旧浏览器/Safari 旧版）或用户开了"减少动态效果"时直接切换。
 */

const SunIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="pointer-events-none size-[1.2rem] rotate-0 scale-100 transition-all duration-500 dark:-rotate-90 dark:scale-0"
  >
    <circle cx="12" cy="12" r="4" />
    {Array.from({ length: 8 }).map((_, i) => {
      const a = (i * Math.PI) / 4;
      return (
        <line
          key={i}
          x1={12 + Math.cos(a) * 7}
          y1={12 + Math.sin(a) * 7}
          x2={12 + Math.cos(a) * 9.5}
          y2={12 + Math.sin(a) * 9.5}
        />
      );
    })}
  </svg>
);

const MoonIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="pointer-events-none absolute size-[1.2rem] rotate-90 scale-0 transition-all duration-500 dark:rotate-0 dark:scale-100"
  >
    <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
  </svg>
);

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const { reducedMotion } = usePerfProfile();
  const [mounted, setMounted] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="size-9" />;

  const toggle = async () => {
    const newTheme = resolvedTheme === "dark" ? "light" : "dark";

    type VTDocument = Document & {
      startViewTransition?: (cb: () => void) => {
        ready: Promise<void>;
      };
    };
    const doc = document as VTDocument;

    if (!doc.startViewTransition || reducedMotion) {
      setTheme(newTheme);
      return;
    }

    // 以按钮中心为圆心，算出覆盖全屏四角所需的最大半径
    const rect = btnRef.current?.getBoundingClientRect();
    const x = (rect?.left ?? 0) + (rect?.width ?? 0) / 2;
    const y = (rect?.top ?? 0) + (rect?.height ?? 0) / 2;
    const maxRadius = rect
      ? Math.hypot(
          Math.max(x, window.innerWidth - x),
          Math.max(y, window.innerHeight - y)
        )
      : Math.hypot(window.innerWidth, window.innerHeight);

    const transition = doc.startViewTransition(() => {
      // flushSync 让 React 在浏览器拍"新快照"之前同步完成 DOM 更新
      flushSync(() => setTheme(newTheme));
    });

    await transition.ready;
    document.documentElement.animate(
      {
        clipPath: [
          `circle(0px at ${x}px ${y}px)`,
          `circle(${maxRadius}px at ${x}px ${y}px)`,
        ],
      },
      {
        duration: 500,
        easing: "ease-in-out",
        pseudoElement: "::view-transition-new(root)",
      }
    );
  };

  return (
    <button
      ref={btnRef}
      aria-label="Toggle theme"
      onClick={toggle}
      className="relative grid size-9 place-items-center rounded-full border border-border/60 bg-background/60 text-foreground/80 backdrop-blur transition-colors hover:text-foreground"
    >
      <SunIcon />
      <MoonIcon />
    </button>
  );
}
