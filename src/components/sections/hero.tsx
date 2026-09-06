"use client";

import { config } from "@/data/config";

/** Hero：全宽两栏（学自原站）——文字贴左、右半屏留给 3D 键盘。
 *  不套 max-width 居中容器，宽屏下文字保持在左缘，键盘占右侧。 */
export function HeroSection() {
  return (
    <section
      id="hero"
      className="relative flex h-screen w-full items-center px-6 md:px-16 lg:px-24 xl:px-28"
    >
      <div className="grid w-full md:grid-cols-2">
        <div className="flex flex-col items-start justify-center">
          <p className="text-lg text-muted-foreground">Hi, I am</p>
          <h1 className="font-display text-6xl font-bold leading-none tracking-tight md:text-8xl">
            {config.author.split(" ").map((word, i) => (
              <span key={i} className="block">
                {word}
              </span>
            ))}
          </h1>
          <p className="mt-6 text-xl text-muted-foreground md:text-2xl">
            {config.role}
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-3">
            <a
              href="#contact"
              className="rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground"
            >
              Hire Me
            </a>
            <a
              href={config.social.github}
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-border/70 px-6 py-2.5 text-sm font-semibold"
            >
              GitHub
            </a>
            <a
              href="/assets/resume.pdf"
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-border/70 px-6 py-2.5 text-sm font-semibold"
              title="简历（PDF，新标签页打开）"
            >
              Resume
            </a>
          </div>
        </div>
        {/* 右栏：留给 3D 键盘（hero 状态下键盘被 STATES 摆到右侧远处） */}
        <div className="hidden md:block" />
      </div>

      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce text-muted-foreground">
        ↓
      </div>
    </section>
  );
}
