"use client";

import type { CSSProperties } from "react";
import { SKILLS } from "@/data/skills";
import { usePerfProfile } from "@/hooks/use-perf-profile";
import { useKeyboardScene } from "@/hooks/use-keyboard-scene";
import { SectionHeader } from "../section-header";
import { cn } from "@/lib/utils";

/**
 * 技能区块 —— 渐进增强的双形态：
 *
 *   3D 可用（场景存在 + 设备未降级）：只渲染一个高区块作为"舞台"，
 *   技能本体在 3D 键盘的键帽上（交互见 keyboard-canvas.tsx）。
 *   键盘随滚动 scrub 穿过这个区块，所以需要足够的滚动距离。
 *
 *   3D 不可用：渲染真正的 HTML 技能网格（品牌色发光卡片）。
 *   内容永远不因为 WebGL 缺失而丢失。
 */
export function SkillsSection() {
  const { disable3D, ready } = usePerfProfile();
  const sceneStatus = useKeyboardScene();
  const use3D = ready && !disable3D && sceneStatus === "available";

  if (use3D) {
    return (
      <section
        id="skills"
        className="pointer-events-none h-screen w-full md:h-[150dvh]"
      >
        <div className="px-6 pt-24 md:px-16">
          <SectionHeader
            title="Tech Stack"
            desc="(hint: press a key / hover the keycaps)"
          />
        </div>
      </section>
    );
  }

  return (
    <section
      id="skills"
      className="flex w-full min-h-screen flex-col justify-center px-6 py-24 md:px-16"
    >
      <div className="mx-auto w-full max-w-6xl">
        <SectionHeader title="Tech Stack" desc="Tools I build with" />
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5">
          {Object.values(SKILLS).map((skill) => (
            <li
              key={skill.name}
              style={{ "--skill": skill.color } as CSSProperties}
              className={cn(
                // 本区块位于 .canvas-overlay-mode（容器 pointer-events:none，
                // 让 3D 画布可被点击）——在卡片上恢复，hover 才不局限于图标/文字
                "pointer-events-auto",
                "group relative flex flex-col items-center justify-center gap-3 overflow-hidden rounded-2xl p-5",
                "border border-border/60 bg-secondary/20 backdrop-blur-sm",
                "transition-[transform,border-color,background-color,box-shadow] duration-300",
                "hover:-translate-y-1 hover:border-[var(--skill)] hover:bg-secondary/40",
                "hover:shadow-[0_10px_40px_-12px_var(--skill)]"
              )}
            >
              <span
                aria-hidden
                style={{ background: "var(--skill)" }}
                className="pointer-events-none absolute -top-6 h-16 w-16 rounded-full opacity-25 blur-2xl transition-opacity duration-300 group-hover:opacity-70"
              />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={skill.icon}
                alt={skill.label}
                width={44}
                height={44}
                loading="lazy"
                className="relative size-9 object-contain drop-shadow-sm transition-transform duration-300 group-hover:scale-110 md:size-11"
              />
              <span className="relative text-center text-xs font-medium text-foreground/80 transition-colors group-hover:text-foreground md:text-sm">
                {skill.label}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
