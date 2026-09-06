"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { gsap } from "gsap";

/**
 * 弹性光标（对照源项目 ElasticCursor 复刻）：
 *
 *   - 果冻光斑：50px 圆框 + backdrop-filter: invert 反色滤镜，用 gsap
 *     elastic 弹簧跟随鼠标，带速度驱动的挤压/拉伸/旋转（果冻感）；
 *   - 磁吸包裹：悬浮 a/button 时，光斑变形贴合成目标外扩矩形，
 *     同时目标被轻微拉向鼠标（磁吸），移开后 elastic 回弹；
 *   - 精确小点：紧贴真实指针位置（自由移动时）；
 *   - 退出机制：粗指针（触屏）不启用；data-no-custom-cursor="true"
 *     的区域（聊天面板/弹窗等文本操作区）完全还原系统光标。
 *
 * 与源项目的差异：无 preloader（不兼做加载条）、无博客路由逻辑、
 * 磁吸目标从 .cursor-can-hover 扩大为 a/button（我们的链接没打标）。
 */

// A persistent, render-independent value (kept in a ref, created lazily once).
function useInstance<T>(create: () => T): T {
  const ref = useRef<T | null>(null);
  if (ref.current === null) ref.current = create();
  return ref.current;
}

// Velocity-driven squeeze amount for the free-roaming blob.
function getScale(diffX: number, diffY: number) {
  const distance = Math.sqrt(Math.pow(diffX, 2) + Math.pow(diffY, 2));
  return Math.min(distance / 735, 0.35);
}

// Velocity-driven rotation (degrees) for the free-roaming blob.
function getAngle(diffX: number, diffY: number) {
  return (Math.atan2(diffY, diffX) * 180) / Math.PI;
}

const clamp = (v: number, min: number, max: number) =>
  Math.max(min, Math.min(max, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

const CURSOR_DIAMETER = 50;
const WRAP_PADDING = 8; // breathing room when hugging a target
const WRAP_RADIUS = 12; // corner radius while wrapped
const WRAP_EASE = 0.2; // how fast the cursor snaps to/from a target
const TARGET_PULL = 0.35; // fraction of pointer offset the target travels
const TARGET_EASE = 0.25; // how fast the target follows the pointer
/** 拉力上限按目标宽度自适应：小按钮 12px，宽按钮（Hero 药丸等）最多 22px */
const targetPullCap = (width: number) => clamp(width * 0.18, 12, 22);
const CURSOR_PARALLAX = 0.12; // extra lead of the cursor toward the pointer
const CURSOR_MAX_LEAD = 10; // px cap on that lead, independent of target size

// Magnetic feel: the cursor morphs to hug the hovered element, and the element
// is pulled toward the pointer.
const wrapsTarget = true;
const movesTarget = true;

type Base = {
  left: number;
  top: number;
  width: number;
  height: number;
  cx: number;
  cy: number;
  /** 目标自身的圆角（包裹形状跟随按钮形状：药丸包成药丸） */
  radius: number;
};
type ActiveTarget = {
  el: HTMLElement | null;
  base: Base | null;
  offX: number;
  offY: number};
type Setters = Record<string, Function>;

function measure(el: HTMLElement): Base {
  const r = el.getBoundingClientRect();
  // border-radius 可能是 "9999px"（药丸）或空；解析失败退回固定小圆角
  const parsed = parseFloat(getComputedStyle(el).borderRadius);
  const radius = Number.isFinite(parsed) ? parsed : WRAP_RADIUS;
  return {
    left: r.left,
    top: r.top,
    width: r.width,
    height: r.height,
    cx: r.left + r.width / 2,
    cy: r.top + r.height / 2,
    radius,
  };
}

export function ElasticCursor() {
  const [enabled, setEnabled] = useState(false);
  /** 首次鼠标移动后才开始渲染循环（原版同款：避免光斑从 (0,0) 角落飞入） */
  const [cursorMoved, setCursorMoved] = useState(false);
  const cursorMovedRef = useRef(false);
  // 粗指针（触屏/无鼠标）不启用；窗口变化时跟随更新
  useEffect(() => {
    const mq = window.matchMedia("(pointer: fine)");
    const update = () => setEnabled(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const jellyRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);

  const isHiddenRef = useRef(false);

  // Spring used for the free-roam blob, plus the derived velocity.
  const pos = useInstance(() => ({ x: 0, y: 0 }));
  const vel = useInstance(() => ({ x: 0, y: 0 }));
  // Raw pointer (no smoothing) for the precise dot.
  const pointer = useInstance(() => ({ x: 0, y: 0 }));
  // Current rendered blob geometry, lerped toward its target every frame.
  const jelly = useInstance(() => ({
    x: 0,
    y: 0,
    w: CURSOR_DIAMETER,
    h: CURSOR_DIAMETER,
    r: CURSOR_DIAMETER / 2,
    sx: 1,
    sy: 1,
  }));
  const active = useInstance<ActiveTarget>(() => ({
    el: null,
    base: null,
    offX: 0,
    offY: 0,
  }));
  const set = useInstance<Setters>(() => ({}));

  // Bind GSAP quick setters to the live nodes.
  useLayoutEffect(() => {
    if (!enabled) return;
    const jellyEl = jellyRef.current;
    const dotEl = dotRef.current;
    if (!jellyEl || !dotEl) return;
    gsap.set(jellyEl, { xPercent: -50, yPercent: -50 });
    gsap.set(dotEl, { xPercent: -50, yPercent: -50 });
    set.x = gsap.quickSetter(jellyEl, "x", "px");
    set.y = gsap.quickSetter(jellyEl, "y", "px");
    set.r = gsap.quickSetter(jellyEl, "rotate", "deg");
    set.sx = gsap.quickSetter(jellyEl, "scaleX");
    set.sy = gsap.quickSetter(jellyEl, "scaleY");
    set.width = gsap.quickSetter(jellyEl, "width", "px");
    set.height = gsap.quickSetter(jellyEl, "height", "px");
    set.radius = gsap.quickSetter(jellyEl, "borderRadius", "px");
    set.opacity = gsap.quickSetter(jellyEl, "opacity");
    set.dotX = gsap.quickSetter(dotEl, "x", "px");
    set.dotY = gsap.quickSetter(dotEl, "y", "px");
    set.dotOpacity = gsap.quickSetter(dotEl, "opacity");
  }, [enabled]);

  // Single render loop on the shared gsap ticker.
  const render = useCallback(() => {
    if (!set.x) return;

    set.dotX(pointer.x);
    set.dotY(pointer.y);

    const el = active.el;
    const wrapping = !!el && wrapsTarget;
    const moveTarget = !!el && movesTarget;
    const hidden = isHiddenRef.current;

    // Pull the hovered element toward the pointer (magnetic button), capped.
    if (moveTarget && el && active.base) {
      const b = active.base;
      const cap = targetPullCap(b.width);
      const pullX = clamp(
        (pointer.x - b.cx) * TARGET_PULL,
        -cap,
        cap,
      );
      const pullY = clamp(
        (pointer.y - b.cy) * TARGET_PULL,
        -cap,
        cap,
      );
      active.offX = lerp(active.offX, pullX, TARGET_EASE);
      active.offY = lerp(active.offY, pullY, TARGET_EASE);
      gsap.set(el, { x: active.offX, y: active.offY });
    }

    if (wrapping && active.base && el) {
      // Cursor snaps to hug the target (and follows it while it's moving).
      // 每帧重测目标边界：悬浮目标自身的宽度动画（如聊天按钮拉宽）不会让包裹框脱节
      const b = active.base;
      const r = el.getBoundingClientRect();
      b.left = r.left - active.offX;
      b.top = r.top - active.offY;
      b.width = r.width;
      b.height = r.height;
      b.cx = b.left + r.width / 2;
      b.cy = b.top + r.height / 2;
      // 包裹圆角跟随目标形状，上限为包裹框高度的一半（药丸 → 两端半圆）
      const wrapH = b.height + WRAP_PADDING * 2;
      jelly.r = lerp(jelly.r, Math.min(b.radius, wrapH / 2), WRAP_EASE);
      const leadX = clamp(
        (pointer.x - b.cx) * CURSOR_PARALLAX,
        -CURSOR_MAX_LEAD,
        CURSOR_MAX_LEAD,
      );
      const leadY = clamp(
        (pointer.y - b.cy) * CURSOR_PARALLAX,
        -CURSOR_MAX_LEAD,
        CURSOR_MAX_LEAD,
      );
      const tx = b.cx + active.offX + leadX;
      const ty = b.cy + active.offY + leadY;
      jelly.x = lerp(jelly.x, tx, WRAP_EASE);
      jelly.y = lerp(jelly.y, ty, WRAP_EASE);
      jelly.w = lerp(jelly.w, b.width + WRAP_PADDING * 2, WRAP_EASE);
      jelly.h = lerp(jelly.h, b.height + WRAP_PADDING * 2, WRAP_EASE);
      jelly.sx = lerp(jelly.sx, 1, 0.3);
      jelly.sy = lerp(jelly.sy, 1, 0.3);
      set.x(jelly.x);
      set.y(jelly.y);
      set.width(jelly.w);
      set.height(jelly.h);
      set.radius(jelly.r);
      set.sx(jelly.sx);
      set.sy(jelly.sy);
      set.r(0);
      set.opacity(hidden ? 0 : 1);
      set.dotOpacity(0); // fold the dot away — one unified cursor
    } else {
      // Free roam: elastic spring position + velocity-driven squish.
      const rotation = getAngle(vel.x, vel.y);
      const scale = getScale(vel.x, vel.y);
      jelly.x = pos.x;
      jelly.y = pos.y;
      jelly.w = lerp(jelly.w, CURSOR_DIAMETER + scale * 300, 0.4);
      jelly.h = lerp(jelly.h, CURSOR_DIAMETER, 0.4);
      jelly.r = lerp(jelly.r, CURSOR_DIAMETER / 2, 0.4);
      jelly.sx = 1 + scale;
      jelly.sy = 1 - scale * 2;
      set.x(pos.x);
      set.y(pos.y);
      set.width(jelly.w);
      set.height(jelly.h);
      set.radius(jelly.r);
      set.r(rotation);
      set.sx(jelly.sx);
      set.sy(jelly.sy);
      set.opacity(hidden ? 0 : 1);
      set.dotOpacity(hidden ? 0 : 1);
    }
  }, []);

  useEffect(() => {
    if (!enabled || !cursorMoved) return;
    gsap.ticker.add(render);
    return () => {
      gsap.ticker.remove(render);
      document.body.style.cursor = "";
    };
  }, [enabled, cursorMoved, render]);

  // Track the raw pointer, drive the free-roam spring, and update hide flag.
  useEffect(() => {
    if (!enabled) return;
    const onMove = (e: MouseEvent) => {
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      if (!cursorMovedRef.current) {
        cursorMovedRef.current = true;
        setCursorMoved(true);
      }
      // 原版同款：不加 overwrite——每次移动都叠加一条 elastic 弹簧，
      // 旧弹簧继续衰减，新弹簧接管，形成绵长的果冻拖尾形变
      gsap.to(pos, {
        x: e.clientX,
        y: e.clientY,
        duration: 1.5,
        ease: "elastic.out(1, 0.5)",
        onUpdate: () => {
          vel.x = (e.clientX - pos.x) * 1.2;
          vel.y = (e.clientY - pos.y) * 1.2;
        },
      });

      const hide = !!(e.target as Element | null)?.closest?.(
        '[data-no-custom-cursor="true"]',
      );
      isHiddenRef.current = hide;
      document.body.style.cursor = hide ? "auto" : "";
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, [enabled]);

  // Acquire/release targets via event delegation.
  useEffect(() => {
    if (!enabled) return;

    const acquire = (el: HTMLElement) => {
      gsap.killTweensOf(el);
      active.el = el;
      active.base = measure(el);
      active.offX = 0;
      active.offY = 0;
      jelly.x = pos.x;
      jelly.y = pos.y;
      if (movesTarget) el.style.willChange = "transform";
    };

    const release = () => {
      const el = active.el;
      if (el && movesTarget) {
        gsap.to(el, {
          x: 0,
          y: 0,
          duration: 0.7,
          ease: "elastic.out(1, 0.35)",
          clearProps: "transform",
          onComplete: () => {
            el.style.willChange = "";
          },
        });
      }
      active.el = null;
      active.base = null;
      active.offX = 0;
      active.offY = 0;
    };

    const onOver = (e: Event) => {
      const target = e.target as Element | null;
      if (target?.closest?.('[data-no-custom-cursor="true"]')) {
        if (active.el) release();
        return;
      }
      const t = target?.closest?.("a, button") as HTMLElement | null;
      if (t === active.el) return;
      if (active.el) release();
      // 菜单大字导航（.menu-link）保留自身的逐字滚换效果，不做光标包裹
      if (t && t.classList.contains("menu-link")) return;
      if (t) acquire(t);
    };
    const onLeave = () => {
      if (active.el) release();
    };
    // Keep the resting bounds correct under scroll.
    const onScroll = () => {
      if (!active.el || !active.base) return;
      const r = active.el.getBoundingClientRect();
      active.base.left = r.left - active.offX;
      active.base.top = r.top - active.offY;
      active.base.width = r.width;
      active.base.height = r.height;
      active.base.cx = active.base.left + r.width / 2;
      active.base.cy = active.base.top + r.height / 2;
    };

    document.addEventListener("pointerover", onOver);
    document.addEventListener("mouseleave", onLeave);
    window.addEventListener("blur", onLeave);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      document.removeEventListener("pointerover", onOver);
      document.removeEventListener("mouseleave", onLeave);
      window.removeEventListener("blur", onLeave);
      window.removeEventListener("scroll", onScroll);
      if (active.el) release();
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <>
      <div
        ref={jellyRef}
        className="jelly-blob pointer-events-none fixed left-0 top-0 border-2 border-black will-change-transform dark:border-white"
        style={{
          width: CURSOR_DIAMETER,
          height: CURSOR_DIAMETER,
          borderRadius: CURSOR_DIAMETER / 2,
          boxSizing: "border-box",
          zIndex: 100,
          backdropFilter: "invert(100%)",
        }}
      ></div>
      <div
        ref={dotRef}
        className="pointer-events-none fixed left-0 top-0 h-3 w-3 rounded-full will-change-transform"
        style={{
          opacity: 0,
          backdropFilter: "invert(100%)",
          zIndex: 101,
        }}
      ></div>
    </>
  );
}
