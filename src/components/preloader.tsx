"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useLenis } from "lenis/react";

/**
 * Preloader —— Minimal CLI / npm 安装终端风加载屏（按用户提供的 HTML 设计 1:1 移植）：
 *   - 黑底 + JetBrains Mono 终端卡片：braille 菊花、$ pnpm add 命令行、
 *     字节计数 / 速度 / ETA / 包名流式日志、左下角超大百分比
 *   - 进度模拟：非线性加速 + 网络微抖动；点击 +15%，Esc 快进到 99.5%
 *   - 完成后 ✔ + "Done" 日志 → 整屏向上擦出（Wipe）→ 卸载，Hero 衔接
 *   - 仅会话内首次访问显示（sessionStorage 门禁）；期间锁定 Lenis 滚动
 */

const KEY = "preloader-shown";


type Phase = "idle" | "loading" | "complete" | "wipe" | "done";

const SPINNER_GLYPHS = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

const PACKAGES = [
  { scope: "@kamie/", name: "creative-core", file: "engine/webgl-canvas.ts" },
  { scope: "@kamie/", name: "tactile-physics", file: "springs/damping-solver.wasm" },
  { scope: "@types/", name: "fullstack-spec", file: "ast/type-graph.json" },
  { scope: "@three/", name: "shader-graph", file: "shaders/starfield.frag" },
  { scope: "@kamie/", name: "ui-primitives", file: "components/keycap-mesh.bin" },
  { scope: "@kamie/", name: "interactive-runtime", file: "audio/synthesizer-worklet.js" },
  { scope: "@kamie/", name: "portfolio-manifest", file: "bundle/app.production.min.js" },
];

const TOTAL_MB = 23.6;

export function Preloader() {
  const lenis = useLenis();
  const [phase, setPhase] = useState<Phase>("idle");
  const [progress, setProgress] = useState(0);
  const [spinner, setSpinner] = useState(SPINNER_GLYPHS[0]);
  const [pkgIndex, setPkgIndex] = useState(0);
  const decided = useRef(false);

  // 门禁：会话内只显示一次
  useEffect(() => {
    if (decided.current) return;
    decided.current = true;
    let seen = false;
    try {
      seen = sessionStorage.getItem(KEY) === "1";
    } catch {
      /* 隐私模式等场景下静默跳过 */
    }
    if (seen) {
      setPhase("done");
      return;
    }
    setPhase("loading");
    try {
      sessionStorage.setItem(KEY, "1");
    } catch {
      /* 同上 */
    }
  }, []);

  // 可见期间锁滚动
  useEffect(() => {
    if (phase === "idle" || phase === "done") return;
    lenis?.stop();
    return () => lenis?.start();
  }, [phase, lenis]);

  // braille 菊花旋转
  useEffect(() => {
    if (phase !== "loading") return;
    let i = 0;
    const t = setInterval(() => {
      i = (i + 1) % SPINNER_GLYPHS.length;
      setSpinner(SPINNER_GLYPHS[i]);
    }, 70);
    return () => clearInterval(t);
  }, [phase]);

  // 非线性下载模拟（对照设计的 updateDownload）
  useEffect(() => {
    if (phase !== "loading") return;
    let timer = 0;
    const tick = () => {
      setProgress((p) => {
        if (p >= 100) return p;
        // 节奏压缩到 ~2.5s：前段大步快跑，85% 后减速，96% 后爬行
        let inc = (Math.random() * 1.8 + 0.5) * 2.6;
        if (p > 85) inc = Math.random() * 0.9 + 0.3;
        if (p > 96) inc = 0.4;
        return Math.min(100, p + inc);
      });
    };
    timer = window.setInterval(tick, 100);
    return () => clearInterval(timer);
  }, [phase]);

  // 完成态停留 0.9s 展示 Done 日志 → 擦出（并广播，音乐按钮据此弹出气泡）
  useEffect(() => {
    if (phase !== "complete") return;
    const t = setTimeout(() => {
      setPhase("wipe");
      window.dispatchEvent(new CustomEvent("preloader:done"));
    }, 900);
    return () => clearTimeout(t);
  }, [phase]);

  useEffect(() => {
    if (phase === "wipe") {
      const t = setTimeout(() => setPhase("done"), 780);
      return () => clearTimeout(t);
    }
  }, [phase]);

  // 点击加速 / Esc 快进（设计自带）
  useEffect(() => {
    if (phase !== "loading") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setProgress((p) => Math.max(p, 99.5));
    };
    const onClick = () =>
      setProgress((p) => (p < 100 ? Math.min(100, p + 15) : p));
    window.addEventListener("keydown", onKey);
    window.addEventListener("click", onClick);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("click", onClick);
    };
  }, [phase]);

  // 完成 → 停顿展示 Done 日志 → 擦出
  const completed = progress >= 100;
  useEffect(() => {
    if (phase === "loading" && completed) setPhase("complete");
  }, [completed, phase]);

  if (phase === "idle" || phase === "done") return null;

  const bytes = (progress / 100) * TOTAL_MB;
  const pkg = PACKAGES[Math.min(PACKAGES.length - 1, Math.floor((progress / 100) * PACKAGES.length))];
  const eta = completed
    ? "complete"
    : Math.max(0.1, (100 - progress) * 0.035).toFixed(1) + "s";
  const speed = completed
    ? "— MB/s"
    : (14.2 + ((progress * 7) % 8.4) - 3.2).toFixed(1) + " MB/s";
  const padded = String(Math.floor(progress)).padStart(3, "0") + "%";

  return createPortal(
    <div
      className="pl-root fixed inset-0 z-[200] flex min-h-screen flex-col justify-between bg-black p-8 text-white md:p-12 lg:p-16"
      data-phase={phase}
      aria-hidden
      style={{ fontFamily: "var(--font-jbmono), monospace" }}
      onClick={() => setProgress((p) => (p < 100 ? Math.min(100, p + 15) : p))}
    >
      {/* 顶部占位（平衡布局） */}
      <div className="h-4 w-full" />

      {/* 中央：CLI 安装终端卡片 */}
      <div className="relative z-10 mx-auto flex w-full max-w-2xl flex-col items-center justify-center text-center">
        <div className="mb-5 flex items-center justify-center gap-3 font-mono text-sm text-white md:text-base">
          <span
            className={`inline-block w-4 text-base font-bold leading-none ${
              completed ? "text-emerald-400" : "text-emerald-400"
            }`}
          >
            {completed ? "✔" : spinner}
          </span>
          <span className="font-sans text-xs uppercase tracking-wider text-neutral-500">
            fetching
          </span>
          <span className="flex items-center gap-1.5 text-base font-semibold tracking-tight text-white md:text-lg">
            <span className="font-normal text-neutral-500">{pkg.scope}</span>
            <span>{pkg.name}</span>
          </span>
        </div>

        <div className="relative w-full max-w-xl overflow-hidden rounded-xl border border-neutral-800/80 bg-neutral-950/90 p-5 text-left shadow-2xl backdrop-blur-md">
          {/* 顶部青色渐变光边 */}
          <div className="absolute left-0 right-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent" />

          {/* 命令行 */}
          <div className="mb-4 flex items-center justify-between font-mono text-xs text-neutral-400">
            <div className="flex items-center gap-2">
              <span className="font-bold text-emerald-400">$</span>
              <span className="text-neutral-300">pnpm add</span>
              <span className="font-medium text-cyan-300">@kamie/portfolio</span>
              <span
                className={`inline-block h-3.5 w-1.5 bg-cyan-400 ${
                  completed ? "" : "animate-pulse"
                }`}
              />
            </div>
            <div className="text-[11px] font-mono text-neutral-500">eta {eta}</div>
          </div>

          {/* 字节计数与速度 */}
          <div className="flex flex-wrap items-center justify-between py-1 font-mono text-xs">
            <div className="flex items-baseline gap-1">
              <span className="text-sm font-medium text-white">
                {bytes.toFixed(2)}
              </span>
              <span className="text-neutral-600">/</span>
              <span className="text-neutral-500">{TOTAL_MB.toFixed(2)} MB</span>
              <span className="ml-2 rounded border border-neutral-800 bg-neutral-900 px-1.5 py-0.5 font-mono text-[10px] text-cyan-400">
                pkg [{Math.min(36, Math.floor((progress / 100) * 36))}/36]
              </span>
            </div>
            <div className="font-mono text-xs text-neutral-400">{speed}</div>
          </div>

          {/* 子步骤日志 */}
          <div className="mt-4 flex items-center justify-between border-t border-neutral-900 pt-3 font-mono text-[11px] text-neutral-500">
            <div className="flex truncate items-center gap-2 pr-2">
              <span className="text-neutral-600">↳</span>
              <span className="truncate text-neutral-400">
                {completed
                  ? "Done in 2.84s. All 36 packages installed."
                  : `unpacking: ${pkg.file}`}
              </span>
            </div>
            <span
              className={`flex-shrink-0 font-sans text-[10px] font-semibold uppercase tracking-wider ${
                completed ? "text-emerald-400" : "text-emerald-500/90"
              }`}
            >
              {completed ? "done" : "active"}
            </span>
          </div>
        </div>
      </div>

      {/* 左下角：超大等宽百分比 */}
      <div className="relative z-10 flex items-end justify-between">
        <div className="select-none font-mono text-8xl font-bold leading-none tracking-tighter text-white tabular-nums sm:text-9xl md:text-[10rem] lg:text-[12rem]">
          {padded}
        </div>
      </div>

      <style>{`
.pl-root {
  font-variant-numeric: tabular-nums;
  clip-path: inset(0 0 0 0);
  transition: clip-path .75s cubic-bezier(0.76, 0, 0.24, 1);
  user-select: none;
}
.pl-root[data-phase="wipe"] { clip-path: inset(0 0 100% 0); }
.pl-root * { user-select: none; }
.tabular-nums { font-variant-numeric: tabular-nums; }
`}</style>
    </div>,
    document.body,
  );
}
