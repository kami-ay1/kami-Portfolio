"use client";

import { useEffect, useState } from "react";
import { config } from "@/data/config";
import { ThemeToggle } from "./theme-toggle";
import { MenuButton, MenuOverlay } from "./nav-menu";
import { Guestbook } from "./guestbook/guestbook";

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-30">
      {/* 顶栏条：毛玻璃底；菜单打开时加深（原项目同款联动）。
          空白处 pointer-events 穿透到下层 3D 画布。 */}
      <div
        className={`pointer-events-auto relative z-10 flex h-16 w-full items-center justify-between px-6 backdrop-blur-md transition-colors duration-500 md:px-16 lg:px-24 xl:px-28 ${
          menuOpen ? "bg-background/85" : "bg-background/60"
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
          <ThemeToggle />
          <MenuButton isActive={menuOpen} onClick={() => setMenuOpen((v) => !v)} />
        </div>
      </div>

      {/* 蒙层 + 菜单面板：作为 header 直接子级，锚定在顶栏下沿 */}
      <MenuOverlay isActive={menuOpen} onClose={() => setMenuOpen(false)} />
    </header>
  );
}
