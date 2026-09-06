"use client";

import { useEffect, useState } from "react";
import { useLenis } from "lenis/react";
import { config } from "@/data/config";
import { ThemeToggle } from "./theme-toggle";
import { MusicToggle } from "./music-toggle";
import { MenuButton, MenuOverlay } from "./nav-menu";
import { Guestbook } from "./guestbook/guestbook";

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const lenis = useLenis();
  /** 关闭菜单时顶栏先保持透明，等面板完全擦除（0.75s）再渐变回原色 */
  const [barHold, setBarHold] = useState(false);

  useEffect(() => {
    if (menuOpen) {
      setBarHold(true);
      return;
    }
    const t = setTimeout(() => setBarHold(false), 750);
    return () => clearTimeout(t);
  }, [menuOpen]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  // 菜单打开时锁滚动：停 Lenis + 隐藏滚动条（防滚轮也防拖拽），关闭恢复
  useEffect(() => {
    if (menuOpen) {
      lenis?.stop();
      document.documentElement.style.overflow = "hidden";
    } else {
      lenis?.start();
      document.documentElement.style.overflow = "";
    }
  }, [menuOpen, lenis]);

  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-30">
      {/* 顶栏按钮统一的悬浮着色：从中心晕开的柔和色块（currentColor 低透明度），
          与弹性光标的包裹动效呼应；内联 style 避开 dev CSS 缓存 */}
      <style>{`
.btn-fill { position: relative; }
.btn-fill::before {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: currentColor;
  opacity: 0;
  transform: scale(0.55);
  transition:
    opacity 0.35s cubic-bezier(0.65, 0.05, 0.35, 1),
    transform 0.35s cubic-bezier(0.65, 0.05, 0.35, 1);
  pointer-events: none;
}
.btn-fill:hover::before {
  opacity: 0.08;
  transform: scale(1);
}
`}</style>
      {/* 顶栏条：毛玻璃底；菜单打开时加深（原项目同款联动）。
          空白处 pointer-events 穿透到下层 3D 画布。 */}
      <div
        className={`pointer-events-auto relative z-10 flex h-16 w-full items-center justify-between pl-[30px] pr-[20px] backdrop-blur-md transition-colors duration-500 ${
          menuOpen || barHold ? "bg-transparent" : "bg-background/60"
        }`}
      >
        <a
          href="#hero"
          className="font-display text-lg font-bold tracking-tight"
        >
          {config.author}
        </a>
        <div className="flex items-center gap-4">
          <Guestbook />
          <MusicToggle />
          <ThemeToggle />
          <MenuButton isActive={menuOpen} onClick={() => setMenuOpen((v) => !v)} />
        </div>
      </div>

      {/* 蒙层 + 菜单面板：作为 header 直接子级，锚定在顶栏下沿 */}
      <MenuOverlay isActive={menuOpen} onClose={() => setMenuOpen(false)} />
    </header>
  );
}
