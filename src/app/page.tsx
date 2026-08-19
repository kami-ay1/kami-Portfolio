"use client";

import { useEffect } from "react";
import SmoothScroll from "@/components/smooth-scroll";
import KeyboardCanvas from "@/components/keyboard-canvas";
import { Particles } from "@/components/particles";
import { checkKeyboardScene } from "@/hooks/use-keyboard-scene";
import { config } from "@/data/config";
import { HeroSection } from "@/components/sections/hero";
import { SkillsSection } from "@/components/sections/skills";
import { ExperienceSection } from "@/components/sections/experience";
import { ProjectsSection } from "@/components/sections/projects";
import { ContactSection } from "@/components/sections/contact";

/**
 * 页面三明治结构：
 *   KeyboardCanvas —— fixed 的 3D 键盘画布（z-0，全局不随滚动）
 *   main           —— HTML 内容层（在上，随滚动）
 *
 * 内容层背景说明（与原站一致）：暗色主题透明让 3D 键盘全程可见；
 * 亮色主题完全不透明（slate-100 同款色值）把 3D 和粒子整体遮住——
 * 原站的亮色模式就是纯 HTML 页面。想要"隐约透出键盘"的效果，
 * 把 bg-secondary 改成 bg-background/85 即可。
 */
export default function MainPage() {
  useEffect(() => {
    checkKeyboardScene(config.sceneUrl);
  }, []);

  return (
    <SmoothScroll>
      {/* 背景三明治：暗色底(body) → 粒子(-z-10) → 3D 键盘(z-0) → 内容(上层) */}
      <Particles className="fixed inset-0 -z-10" />
      <KeyboardCanvas />
      <main className="canvas-overlay-mode relative bg-secondary dark:bg-transparent">
        <HeroSection />
        <SkillsSection />
        <ExperienceSection />
        <ProjectsSection />
        <ContactSection />
      </main>
    </SmoothScroll>
  );
}
