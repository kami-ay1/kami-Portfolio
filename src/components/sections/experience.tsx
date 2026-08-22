"use client";

import { EXPERIENCE } from "@/data/content";
import { SKILLS } from "@/data/skills";
import { SectionHeader } from "../section-header";

/** 经历：时间线卡片 + 技能 chips（chips 颜色取自技能品牌色） */
export function ExperienceSection() {
  return (
    <section
      id="experience"
      className="flex w-full min-h-screen flex-col justify-center px-6 py-24 md:px-16"
    >
      <div className="mx-auto w-full max-w-4xl">
        <SectionHeader title="Experience" desc="Where I've worked" />

        {/* 亮色模式：外层局部毛玻璃底，避免文字压在 3D 键盘上看不清；
            暗色模式透明无感（padding 两端一致，无布局跳变） */}
        <div className="rounded-2xl bg-background/60 p-4 backdrop-blur-md dark:bg-transparent dark:backdrop-blur-none md:p-6">
          <ol className="relative space-y-12 border-l border-border/60 pl-8">
          {EXPERIENCE.map((exp) => (
            <li key={exp.id} className="relative">
              <span className="absolute -left-[37px] top-1.5 size-3 rounded-full border-2 border-background bg-primary" />
              <p className="text-sm text-muted-foreground">
                {exp.startDate} — {exp.endDate}
              </p>
              <h3 className="mt-1 font-display text-2xl font-bold">
                {exp.title}
                <span className="text-muted-foreground"> @ {exp.company}</span>
              </h3>
              <ul className="mt-4 space-y-2">
                {exp.description.map((item, i) => (
                  <li
                    key={i}
                    className="list-inside list-disc text-foreground/80"
                  >
                    {item}
                  </li>
                ))}
              </ul>
              <div className="mt-4 flex flex-wrap gap-2">
                {exp.skills.map((key) => {
                  const skill = SKILLS[key];
                  if (!skill) return null;
                  return (
                    <span
                      key={key}
                      className="rounded-full border border-border/60 bg-secondary/40 px-3 py-1 text-xs font-medium"
                      style={{ color: skill.color }}
                    >
                      {skill.label}
                    </span>
                  );
                })}
              </div>
            </li>
          ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
