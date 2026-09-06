"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { EXPERIENCE } from "@/data/content";
import { SKILLS } from "@/data/skills";
import { SectionHeader } from "../section-header";

gsap.registerPlugin(ScrollTrigger);

/**
 * 经历 —— 原型 06 的编号行列表（替代旧时间线）：
 *   - 每行 = 编号 + 职位/公司/描述/chips + 时间段 + hover 箭头 ↗
 *   - 入场：行遮罩升起（overflow-hidden 壳 + 内层 translateY(110%)→0，
 *     ScrollTrigger 一次性触发，行间 stagger 0.08s）
 *   - hover：行背景微亮 + 向右让位（Lando 曲线 0.4s）；箭头淡入，
 *     箭头加 cursor-can-hover（弹性光标包裹+磁吸），行本体不包裹
 */
export function ExperienceSection() {
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = listRef.current;
    if (!root) return;
    const lines = root.querySelectorAll<HTMLElement>("[data-exp-line]");
    const tween = gsap.to(lines, {
      y: "0%",
      duration: 0.7,
      ease: "power2.inOut",
      stagger: 0.08,
      paused: true,
    });
    const st = ScrollTrigger.create({
      trigger: root,
      start: "top 85%",
      once: true,
      onEnter: () => tween.play(),
    });
    return () => {
      st.kill();
      tween.kill();
    };
  }, []);

  return (
    <section
      id="experience"
      className="flex w-full min-h-screen flex-col justify-center px-6 py-24 md:px-16"
    >
      <div className="mx-auto w-full max-w-4xl">
        <SectionHeader title="Experience" desc="Where I've worked" />

        {/* 两种主题都保留局部毛玻璃遮罩：内容层透出键盘但不被键帽干扰，
            保证深色模式下白字压在彩色键帽上依然清晰（padding 两端一致，无布局跳变） */}
        <div className="rounded-2xl bg-background/60 p-4 backdrop-blur-md md:p-6">
          <style>{`
.exp-row {
  padding: 22px 12px;
  border-radius: 12px;
  border-bottom: 1px solid rgba(128,128,128,.18);
  transition: background-color .4s var(--ease-lando, ease);
}
/* 悬浮右移用 transform 实现：transform 不参与布局，文字永不重新换行 */
.exp-inner {
  display: grid;
  grid-template-columns: 40px 1fr;
  gap: 8px 16px;
  transition: transform .4s var(--ease-lando, ease);
}
.exp-mask:last-child .exp-row { border-bottom: none; }
.exp-row:hover { background: rgba(0,0,0,.04); }
.dark .exp-row:hover { background: rgba(255,255,255,.05); }
.exp-row:hover .exp-inner { transform: translateX(10px); }
.exp-no { font-size: 13px; color: #8f937f; line-height: 1.9; }
.exp-time { grid-column: 2; font-size: 12px; color: var(--muted-foreground, #9b9b8f); }
@media (min-width: 768px) {
  .exp-inner { grid-template-columns: 64px 1fr auto; gap: 20px; }
  .exp-time { grid-column: auto; text-align: right; white-space: nowrap; font-size: 13px; align-self: start; line-height: 1.9; }
}
`}</style>

          <div ref={listRef}>
            {EXPERIENCE.map((exp, i) => (
              <div key={exp.id} className="exp-mask overflow-hidden">
                <article
                  data-exp-line
                  style={{ transform: "translateY(110%)" }}
                  className="exp-row will-change-transform"
                >
                  <div className="exp-inner">
                  <span className="exp-no font-mono">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0">
                    <h3 className="font-display text-xl font-semibold tracking-tight md:text-2xl">
                      {exp.title}
                      <span className="font-normal text-muted-foreground">
                        {" "}
                        @ {exp.company}
                      </span>
                    </h3>
                    <p className="exp-time mt-1 md:hidden">
                      {exp.startDate} — {exp.endDate}
                    </p>
                    <ul className="mt-3 space-y-1.5">
                      {exp.description.map((item, j) => (
                        <li
                          key={j}
                          className="list-inside list-disc text-sm leading-relaxed text-foreground/80"
                        >
                          {item}
                        </li>
                      ))}
                    </ul>
                    <div className="mt-3.5 flex flex-wrap gap-2">
                      {exp.skills.map((key) => {
                        const skill = SKILLS[key];
                        if (!skill) return null;
                        return (
                          <span
                            key={key}
                            className="flex items-center gap-1.5 rounded-full border border-border/60 bg-secondary/40 py-1 pl-2.5 pr-3 text-xs font-medium"
                            style={{ color: skill.color }}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={skill.icon}
                              alt=""
                              loading="lazy"
                              className="size-3.5 object-contain"
                            />
                            {skill.label}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                  <p className="exp-time hidden md:block">
                    {exp.startDate} — {exp.endDate}
                  </p>
                  </div>
                </article>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
