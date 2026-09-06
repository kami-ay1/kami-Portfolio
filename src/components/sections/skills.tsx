"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SKILLS } from "@/data/skills";
import { usePerfProfile } from "@/hooks/use-perf-profile";
import { useKeyboardScene } from "@/hooks/use-keyboard-scene";
import { SectionHeader } from "../section-header";
import { cn } from "@/lib/utils";

gsap.registerPlugin(ScrollTrigger);

/**
 * 技能区块 —— 渐进增强的双形态：
 *
 *   3D 可用（场景存在 + 设备未降级）：只渲染一个高区块作为"舞台"，
 *   技能本体在 3D 键盘的键帽上（交互见 keyboard-canvas.tsx）。
 *   键盘随滚动 scrub 穿过这个区块，所以需要足够的滚动距离。
 *   标题 "Tech Stack" 做滚动编排（与键盘过渡共用同一条 ScrollTrigger
 *   区间 top 50% → bottom bottom，天然同步）：容器从左上角横移到屏幕
 *   中心；文字以 Lusion 式行遮罩逐行升起出现（行间错峰），离场向上
 *   穿出遮罩——全程无淡入淡出，遮罩即显隐。
 *
 *   3D 不可用：渲染真正的 HTML 技能网格（品牌色发光卡片）。
 *   内容永远不因为 WebGL 缺失而丢失。
 */
export function SkillsSection() {
  const { disable3D, ready } = usePerfProfile();
  const sceneStatus = useKeyboardScene();
  const use3D = ready && !disable3D && sceneStatus === "available";

  const sectionRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);

  // 标题入场：行遮罩升起，一次性播放（nareshkhatri.dev 同款——
  // sticky 停在顶部 70px 处"停顿"，滚动完 section 预留距离后自然向上离开）
  useEffect(() => {
    if (!use3D || !titleRef.current) return;
    const lines = titleRef.current.querySelectorAll("[data-line]");
    const tween = gsap.to(lines, {
      y: "0%",
      duration: 0.8,
      ease: "power2.inOut",
      stagger: 0.14,
      paused: true,
    });
    const st = ScrollTrigger.create({
      trigger: titleRef.current,
      start: "top 92%",
      once: true,
      onEnter: () => tween.play(),
    });
    return () => {
      st.kill();
      tween.kill();
    };
  }, [use3D]);

  if (use3D) {
    return (
      <section
        id="skills"
        className="pointer-events-none w-full h-screen md:h-[150dvh]"
      >
        {/* sticky 停靠：标题随滚动上移，碰到顶部 70px 粘住停顿，
            section 内预留的 mb 距离滚完后自然向上离开（源站同款）。
            行遮罩 + translateY(110%)：首帧即被遮罩裁掉，无闪烁 */}
        <div
          ref={titleRef}
          className="sticky top-[70px] mb-96 text-center will-change-transform"
        >
          <div className="mx-auto w-fit overflow-hidden">
            <h2
              data-line="title"
              style={{ transform: "translateY(110%)" }}
              className="font-display text-4xl font-bold tracking-tight will-change-transform [text-shadow:0_1px_10px_rgba(255,255,255,0.85),0_0_3px_rgba(255,255,255,0.9)] dark:[text-shadow:none] md:text-5xl"
            >
              Tech Stack
            </h2>
          </div>
          <div className="mx-auto mt-3 w-fit overflow-hidden">
            <p
              data-line="desc"
              style={{ transform: "translateY(110%)" }}
              className="text-lg text-muted-foreground will-change-transform [text-shadow:0_1px_8px_rgba(255,255,255,0.9),0_0_3px_rgba(255,255,255,0.9)] dark:[text-shadow:none]"
            >
              (hint: press a key / hover the keycaps)
            </p>
          </div>
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
