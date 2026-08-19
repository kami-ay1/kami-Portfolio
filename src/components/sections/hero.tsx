"use client";

import { config } from "@/data/config";

/** Hero：名字 + 一句话 + 社交链接 + 下滚提示。右侧留给 3D 键盘。 */
export function HeroSection() {
  return (
    <section
      id="hero"
      className="relative flex h-screen w-full flex-col justify-center px-6 md:px-16"
    >
      <div className="mx-auto w-full max-w-6xl">
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
            className="rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5"
          >
            Hire Me
          </a>
          <a
            href={config.social.github}
            target="_blank"
            rel="noreferrer"
            className="rounded-full border border-border/70 px-6 py-2.5 text-sm font-semibold transition-colors hover:bg-secondary/60"
          >
            GitHub
          </a>
          <a
            href={config.social.linkedin}
            target="_blank"
            rel="noreferrer"
            className="rounded-full border border-border/70 px-6 py-2.5 text-sm font-semibold transition-colors hover:bg-secondary/60"
          >
            LinkedIn
          </a>
        </div>
      </div>

      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce text-muted-foreground">
        ↓
      </div>
    </section>
  );
}
