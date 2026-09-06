"use client";

import { useEffect } from "react";
import SmoothScroll from "@/components/smooth-scroll";
import KeyboardCanvas from "@/components/keyboard-canvas";
import { Particles } from "@/components/particles";
import { ElasticCursor } from "@/components/elastic-cursor";
import { Preloader } from "@/components/preloader";
import { ScrollProgress } from "@/components/scroll-progress";
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
 * 内容层背景：两种主题都全透明，3D 键盘全程清爽可见。
 * 可读性不靠全屏白纱，而是给会压在键盘上的文字区块做局部处理：
 * 标题加浅色光晕（text halo）、列表/卡片加局部毛玻璃底（见各 section）。
 */
export default function MainPage() {
  useEffect(() => {
    checkKeyboardScene(config.sceneUrl);
  }, []);

  return (
    <SmoothScroll>
      {/* 首访加载屏（会话内仅一次；加载完向上擦出） */}
      <Preloader />
      {/* 弹性光标（源项目同款；触屏自动禁用） */}
      <ElasticCursor />
      {/* 背景三明治：底色(body) → 粒子(-z-10) → 3D 键盘(z-0) → 内容(上层) */}
      <Particles className="fixed inset-0 -z-10" />
      <KeyboardCanvas />
      {/* 滚动指示条（滚动时出现，停止后淡出） */}
      <ScrollProgress />
      <main className="canvas-overlay-mode relative bg-transparent">
        <HeroSection />
        <SkillsSection />
        <ExperienceSection />
        <ProjectsSection />
        <ContactSection />
      </main>
    </SmoothScroll>
  );
}
