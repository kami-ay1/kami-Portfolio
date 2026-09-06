"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useLenis } from "lenis/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { PROJECTS, type Project } from "@/data/content";
import { SKILLS } from "@/data/skills";
import { SectionHeader } from "../section-header";
import { RollCharEnter } from "../roll-char";

gsap.registerPlugin(ScrollTrigger);

/**
 * Projects —— 原型 07 的 Lusion Featured Work 两列卡（v3.1 实测还原）：
 *   - 入场（一次性）：卡片 y60→0 淡入 ∧ 图区 clip-path inset(8% 6%)→0 展开
 *     ∧ 名称字符轮盘逐字滚落（roll-char.tsx 的 RollCharEnter，hover 不重播）
 *   - hover：仅图内层 scale 1.05 提亮增饱和；唯一文字动效是箭头 → 从名称
 *     左侧遮罩外水平滑入、名称整体右移 1.25em——文字本身零样式变化
 *   - 点击卡片（方案 B，已确认）：弹层展示 STAR 详情（highlights 四行，
 *     背景/任务/行动/结果 彩色胶囊前缀）；Esc / 点遮罩 / ✕ 关闭；
 *     弹层为系统光标区（data-no-custom-cursor）
 *   - 光标策略：卡片不包裹、箭头可包裹
 */

const STAR_TAGS = [
  { key: 0, label: "背景", cls: "star-s" },
  { key: 1, label: "任务", cls: "star-t" },
  { key: 2, label: "行动", cls: "star-a" },
  { key: 3, label: "结果", cls: "star-r" },
] as const;

function StarModal({
  project,
  onClose,
}: {
  project: Project;
  onClose: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  const lenis = useLenis();
  useEffect(() => setMounted(true), []);

  // Esc 关闭 + 弹层期间锁定 Lenis 滚动（与全屏菜单同方案）
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    lenis?.stop();
    return () => {
      window.removeEventListener("keydown", onKey);
      lenis?.start();
    };
  }, [onClose, lenis]);

  if (!mounted) return null;

  return createPortal(
    <div
      data-no-custom-cursor="true"
      className="fixed inset-0 z-[90] grid place-items-center bg-black/65 p-4 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="pw-panel relative w-full max-w-[560px] rounded-2xl border border-border/60 bg-background p-7 shadow-2xl md:p-8">
        <button
          onClick={onClose}
          aria-label="关闭详情"
          className="absolute right-4 top-3.5 text-muted-foreground transition-colors hover:text-foreground"
        >
          ✕
        </button>
        <h4 className="font-display text-2xl font-bold tracking-tight">
          {project.title}
        </h4>
        <p className="mt-1 text-xs uppercase tracking-[0.18em] text-muted-foreground">
          {project.tech
            .map((k) => SKILLS[k]?.label.toLowerCase())
            .filter(Boolean)
            .join(" • ")}
        </p>
        <p className="mt-4 border-l-2 border-border/60 pl-3 text-sm leading-relaxed text-muted-foreground">
          {project.description}
        </p>
        <ul className="mt-5 grid gap-3">
          {STAR_TAGS.map(({ key, label, cls }) =>
            project.highlights?.[key] ? (
              <li key={key} className="flex items-start gap-3">
                <b
                  className={`mt-0.5 shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${cls}`}
                >
                  {label}
                </b>
                <span className="text-[13.5px] leading-relaxed text-foreground/90">
                  {project.highlights[key]}
                </span>
              </li>
            ) : null,
          )}
        </ul>
      </div>
      <style>{`
.pw-panel {
  animation: pw-in .3s cubic-bezier(0.65,0.05,0.35,1);
}
@keyframes pw-in {
  from { opacity: 0; transform: translateY(16px) scale(.95); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
.pw-panel::before {
  content: "";
  position: absolute; top: 0; left: 24px; right: 24px; height: 2px;
  border-radius: 2px; background: #8f937f;
}
.star-s { color: #9b9b8f; border-color: color-mix(in srgb, currentColor 30%, transparent); }
.star-t { color: #e0b87b; border-color: rgba(224,184,123,.35); }
.star-a { color: #aab6f5; border-color: rgba(170,182,245,.35); }
.star-r { color: #a8c79b; border-color: rgba(168,199,155,.35); }
`}</style>
    </div>,
    document.body,
  );
}

export function ProjectsSection() {
  const gridRef = useRef<HTMLDivElement>(null);
  const [openId, setOpenId] = useState<number | null>(null);

  // 入场：每张卡一次性 ScrollTrigger，进入视口即加 .in（CSS 接管全部过渡）
  useEffect(() => {
    const root = gridRef.current;
    if (!root) return;
    const cards = [...root.querySelectorAll<HTMLElement>(".fw-card")];
    const triggers = cards.map((card) =>
      ScrollTrigger.create({
        trigger: card,
        start: "top 88%",
        once: true,
        onEnter: () => card.classList.add("in"),
      }),
    );
    return () => triggers.forEach((t) => t.kill());
  }, []);

  return (
    <section
      id="projects"
      className="flex w-full min-h-screen flex-col justify-center px-6 py-24 md:px-16"
    >
      <div className="mx-auto w-full max-w-7xl">
        <SectionHeader title="Projects" desc="Selected work worth pressing" />

        <div ref={gridRef} className="grid gap-x-10 gap-y-16 md:grid-cols-2">
          {PROJECTS.map((project, i) => (
            <article
              key={project.id}
              onClick={() => setOpenId(project.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setOpenId(project.id);
                }
              }}
              role="button"
              tabIndex={0}
              className={`fw-card relative block cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                i >= 2 ? "md:mt-10" : ""
              }`}
            >
              <span className="fw-idx font-mono">
                P·{String(i + 1).padStart(2, "0")}
              </span>
              <div className="fw-im">
                <div className="fw-im-in">
                  {project.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={project.image}
                      alt={project.title}
                      loading="lazy"
                      className="size-full object-cover"
                    />
                  ) : (
                    <span className="absolute inset-0 grid place-items-center text-xs text-white/35">
                      项目截图 / 3D 预览
                    </span>
                  )}
                </div>
              </div>
              <div className="fw-name">
                <span className="fw-arr cursor-can-hover" aria-hidden>
                  {/* lusion 同款长箭头：细杆 + 小箭头尖（几何对照原站截图） */}
                  <svg
                    viewBox="0 0 48 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3.4"
                    className="block h-auto w-full"
                  >
                    <path d="M0 12 H46" />
                    <path d="M34 1 L46 12 L34 23" />
                  </svg>
                </span>
                <span className="fw-rname font-medium">
                  {project.title.split("").map((ch, ci) => (
                    <RollCharEnter key={ci} ch={ch} index={ci} />
                  ))}
                </span>
              </div>
              <div className="fw-meta">
                <span className="fw-l1 text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
                  {project.tech
                    .map((k) => SKILLS[k]?.label.toLowerCase())
                    .filter(Boolean)
                    .join(" • ")}
                </span>
              </div>
              <div className="fw-meta fw-meta-d">
                <span className="fw-desc text-[13px] leading-relaxed text-muted-foreground">
                  {project.description}
                </span>
              </div>
            </article>
          ))}
        </div>
      </div>

      {openId !== null && (
        <StarModal
          project={PROJECTS.find((p) => p.id === openId)!}
          onClose={() => setOpenId(null)}
        />
      )}

      <style>{`
/* ---- 入场（一次性，.in 由 ScrollTrigger 添加） ---- */
.fw-card {
  opacity: 0;
  transform: translateY(60px);
  transition: opacity .9s cubic-bezier(0.65,0.05,0.35,1), transform .9s cubic-bezier(0.65,0.05,0.35,1);
}
.fw-card.in { opacity: 1; transform: translateY(0); }
/* 图区：65% 比例 + clip 裁切展开 */
.fw-im {
  position: relative; padding-top: 65%; border-radius: 15px; overflow: hidden;
  clip-path: inset(8% 6% 8% 6%);
  transition: clip-path 1.1s cubic-bezier(0.65,0.05,0.35,1);
}
.fw-card.in .fw-im { clip-path: inset(0 0 0 0); }
.fw-im-in {
  position: absolute; inset: 0; background: linear-gradient(135deg,#262733,#191a22);
  transform: scale(1.12);
  transition: transform 1.2s cubic-bezier(0.65,0.05,0.35,1), filter .7s cubic-bezier(0.65,0.05,0.35,1);
  filter: brightness(.75) saturate(.9);
}
.fw-card.in .fw-im-in { transform: scale(1); filter: brightness(.85) saturate(.95); }
/* hover：仅图提亮 + 箭头滑入 + 名称右移（文字本身零样式变化） */
.fw-card:hover .fw-im-in { transform: scale(1.05); filter: brightness(1.05) saturate(1.1); }
.fw-idx {
  position: absolute; left: 0; top: -26px;
  font-size: 11px; letter-spacing: .2em; color: #8f937f;
}
.fw-l1 { font-weight: 500; }
/* 名称行：Lusion 原版箭头逻辑——长箭头绝对定位在名称左缘外（被 overflow
   hidden 裁掉），hover 时名称整体右移让位、箭头滑入让出的空位。
   注意：transition 不能带 entrance 延迟，否则取消悬浮时箭头会比文字晚消失 */
.fw-name {
  position: relative; overflow: hidden;
  display: flex; align-items: center; flex-wrap: nowrap;
  margin-top: 22px;
  /* 全站统一字号：上限 38px 保证最长标题（13em）+ 悬浮缩进 1.6em 仍单行放下 */
  font-size: clamp(22px, 2.2vw, 38px);
  line-height: 1.15;
  letter-spacing: 0;
}
.fw-rname { white-space: nowrap; }
.fw-arr {
  position: absolute; left: 0; top: 50%; margin-top: -.17em;
  width: .66em;
  transform: translateX(-.8em);
  opacity: 0;
  transition: transform .45s cubic-bezier(0.65,0.05,0.35,1), opacity .45s cubic-bezier(0.65,0.05,0.35,1);
}
.fw-arr svg { width: 100%; height: auto; display: block; }
.fw-card:hover .fw-arr,
.fw-card:focus-within .fw-arr { transform: translateX(0); opacity: 1; }
.fw-rname {
  display: inline-block; padding-left: 0;
  transition: padding-left .45s cubic-bezier(0.65,0.05,0.35,1);
}
/* 让位宽度 = 箭头宽 .66em + 箭尖与文字 .67em 呼吸间距（对照 lusion 原图） */
.fw-card:hover .fw-rname,
.fw-card:focus-within .fw-rname { padding-left: 1.33em; }
/* 技术栈行 / 描述行：静止隐藏，hover 与箭头同款从左滑入（触屏常显） */
.fw-meta { overflow: hidden; margin-top: 8px; }
.fw-meta-d { margin-top: 10px; }
.fw-meta > span {
  display: inline-block;
  transform: translateX(-1.1em);
  opacity: 0;
  transition: transform .45s cubic-bezier(0.65,0.05,0.35,1), opacity .45s cubic-bezier(0.65,0.05,0.35,1);
}
.fw-card:hover .fw-meta > span,
.fw-card:focus-within .fw-meta > span { transform: translateX(0); opacity: 1; }
.fw-card:hover .fw-meta-d > span { transition-delay: .06s; }
@media (hover: none) {
  .fw-meta > span { transform: none; opacity: 1; }
  .fw-card:hover .fw-rname { padding-left: 0; }
  .fw-card:hover .fw-arr { opacity: 0; transform: translateX(-1.1em); }
}
/* 字符轮盘入场滚落（祖先 .in 驱动，仅一次） */
.fw-card.in .roll-strip {
  transform: translateY(calc(var(--spins) * -1.1em));
  transition: transform .7s cubic-bezier(0.65,0.05,0.35,1);
}
`}</style>
    </section>
  );
}
