"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { RollChar as RollCharShared } from "./roll-char";
import { config } from "@/data/config";

/**
 * 右上角 Menu —— 两套可切换的面板实现：
 *
 *   MenuOverlay（当前启用）—— Lando 风格全屏菜单（对照 landonorris.com 扒的参数）：
 *   1. 全屏实色面板（无模糊无半透明），橄榄绿单色系，明暗主题各一套；
 *   2. 右对齐超大字导航（~70px 级、字重 400、行高 1.05、不靠加粗靠尺寸）；
 *   3. 逐字入场；hover 时每个字符向上滚出、副本滚入（字符级 stagger）；
 *   4. 当前所在区块的链接置灰弱化（landonorris 的反向高亮）；
 *   5. 底部一行小字：左侧邮箱、右侧社媒；无图片预览，纯排版驱动；
 *   6. 开合 0.75s cubic-bezier(0.65,0.05,0.35,1)，clip-path 向下擦入。
 *
 *   MenuOverlayNaresh（备用）—— 原项目 Naresh 风格：擦除蒙层 + 模糊 +
 *   左侧逐字链接 + 悬停兄弟模糊 + 右侧预览小窗。切换：header.tsx 里换导出名。
 */

type NavLink = { title: string; href: string; thumbnail: string };

const LINKS: NavLink[] = [
  { title: "Home", href: "#hero", thumbnail: "/assets/nav-link-previews/hero.png?v=2" },
  { title: "Skills", href: "#skills", thumbnail: "/assets/nav-link-previews/skills.png?v=2" },
  { title: "Experience", href: "#experience", thumbnail: "/assets/nav-link-previews/experience.png?v=2" },
  { title: "Projects", href: "#projects", thumbnail: "/assets/nav-link-previews/projects.png?v=2" },
  { title: "Contact", href: "#contact", thumbnail: "/assets/nav-link-previews/contact.png?v=2" },
];

/** 原项目同款擦除曲线（Naresh 版用） */
const WIPE = { duration: 1, ease: [0.76, 0, 0.24, 1] as const };

/** Lando 版缓动：慢起慢收的"重手感"（实测自 landonorris.com 过渡参数） */
const LANDO = [0.65, 0.05, 0.35, 1] as const;

/** 触发按钮：Menu/Close 文字交叉淡入 + 双线 burger 旋转成 X（原项目同款） */
export function MenuButton({
  isActive,
  onClick,
}: {
  isActive: boolean;
  onClick: () => void;
}) {
  const line =
    "block h-px w-full bg-foreground transition-all duration-1000 ease-[cubic-bezier(0.76,0,0.24,1)]";
  return (
    <button
      aria-label={isActive ? "Close menu" : "Open menu"}
      aria-expanded={isActive}
      onClick={onClick}
      className="btn-fill pointer-events-auto flex h-6 select-none items-center gap-3"
    >
      <div className="relative hidden h-4 w-12 items-center justify-end text-xs font-semibold uppercase tracking-widest md:flex">
        <motion.span
          animate={{ opacity: isActive ? 0 : 1 }}
          transition={{ duration: 0.3 }}
          className="absolute"
        >
          Menu
        </motion.span>
        <motion.span
          animate={{ opacity: isActive ? 1 : 0 }}
          transition={{ duration: 0.3 }}
          className="absolute"
        >
          Close
        </motion.span>
      </div>
      <div className="relative w-[22px]">
        <span
          className={`${line} ${isActive ? "rotate-45" : "-translate-y-[4px]"}`}
        />
        <span
          className={`${line} ${isActive ? "-rotate-45" : "translate-y-[4px]"}`}
        />
      </div>
    </button>
  );
}

// ---------------- Lando 风格（当前启用） ----------------

/** 打开菜单时计算当前所在区块（该区块的链接置灰弱化） */
function useActiveSection(isOpen: boolean) {
  const [active, setActive] = useState("");
  useEffect(() => {
    if (!isOpen) return;
    const mid = window.scrollY + window.innerHeight / 2;
    let current = LINKS[0].href;
    for (const link of LINKS) {
      const el = document.getElementById(link.href.slice(1));
      if (el && el.offsetTop <= mid) current = link.href;
    }
    setActive(current);
  }, [isOpen]);
  return active;
}

/** 逐字滚换：hover 时字符向上滚出、副本滚入（landonorris.com 同款 text-roll）。
 *  实现抽到 roll-char.tsx 与 Projects 的入场轮盘共享（行为保持不变） */
function RollChar({ ch, index }: { ch: string; index: number }) {
  return <RollCharShared ch={ch} index={index} />;
}

/**
 * Lando 风格全屏面板。作为 header（fixed z-30）的子级，用 z-0 垫在
 * 顶栏条（z-10）之下、页面内容之上；fixed inset-0 覆盖整个视口。
 */
export function MenuOverlay({
  isActive,
  onClose,
}: {
  isActive: boolean;
  onClose: () => void;
}) {
  const activeHref = useActiveSection(isActive);
  /** 当前区块对应的预览图默认点亮 */
  const activeIndex = Math.max(
    0,
    LINKS.findIndex((l) => l.href === activeHref),
  );

  /**
   * 悬浮联动：原生事件委托（本环境里 React 合成 hover 不可靠）。
   * 双保险：既打 .hl .hl-i class（CSS 规则备用），又直接写内联样式
   * （内联优先级最高，确保任何环境下都生效；过渡动画由 .menu-thumb/
   * .menu-big 类里的 transition 提供）。
   */
  const rootRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const apply = (i: number | null) => {
      const thumbs = [...root.querySelectorAll(".menu-thumb")] as HTMLElement[];
      const bigs = [...root.querySelectorAll(".menu-big")] as HTMLElement[];
      thumbs.forEach((el, idx) => {
        const on = i === null ? el.classList.contains("lit") : idx === i;
        el.style.opacity = on ? "1" : "0.3";
        el.style.filter = on ? "none" : "grayscale(1)";
        el.style.boxShadow = on ? "0 0 0 2px var(--thumb-ring)" : "none";
      });
      bigs.forEach((el, idx) => {
        const on = i === null ? el.classList.contains("active") : idx === i;
        el.style.opacity = on ? "1" : "0";
        el.style.transform = on ? "scale(1)" : "scale(1.04)";
      });
    };
    const onOver = (e: MouseEvent) => {
      const el = (e.target as HTMLElement).closest(".menu-link, .menu-thumb");
      if (!el) return;
      const m = el.className.match(/(?:menu-link|menu-thumb)-(\d)/);
      if (m) apply(Number(m[1]));
    };
    const onOut = (e: MouseEvent) => {
      if ((e.target as HTMLElement).closest(".menu-link, .menu-thumb")) apply(null);
    };
    root.addEventListener("mouseover", onOver);
    root.addEventListener("mouseout", onOut);
    return () => {
      root.removeEventListener("mouseover", onOver);
      root.removeEventListener("mouseout", onOut);
    };
  }, []);

  return (
    <motion.div
      ref={rootRef}
      initial={false}
      animate={{
        clipPath: isActive ? "inset(0% 0% 0% 0%)" : "inset(0% 0% 100% 0%)",
      }}
      transition={{ duration: 0.75, ease: LANDO }}
      className="menu-root pointer-events-auto fixed inset-0 z-0 flex flex-col overflow-clip bg-[#E4E7D9] text-[#33362B] dark:bg-[#2C2F20] dark:text-[#DDE1D2]"
    >
      {/* 联动样式内联在组件里（随 JS 更新，绕开 dev 模式 CSS chunk 的缓存问题）：
          左列小图只高亮；中间大图区显示悬浮项（无悬浮时显示当前区块）的放大图 */}
      <style>{`
.menu-root { --thumb-ring: rgb(51 54 43 / 0.7); }
.dark .menu-root { --thumb-ring: rgb(221 225 210 / 0.5); }
.menu-thumb {
  opacity: 0.3;
  filter: grayscale(1);
  transition:
    opacity 0.5s cubic-bezier(0.65, 0.05, 0.35, 1),
    filter 0.5s cubic-bezier(0.65, 0.05, 0.35, 1),
    box-shadow 0.5s cubic-bezier(0.65, 0.05, 0.35, 1);
}
.menu-thumb.lit,
.menu-thumb:hover {
  opacity: 1;
  filter: none;
  box-shadow: 0 0 0 2px var(--thumb-ring);
}
/* 悬浮任意项时：默认亮着的当前区块让位 */
.menu-root.hl .menu-thumb.lit {
  opacity: 0.3;
  filter: grayscale(1);
  box-shadow: none;
}
/* 高亮悬浮项对应的小图 */
.menu-root.hl-0 .menu-thumb-0,
.menu-root.hl-1 .menu-thumb-1,
.menu-root.hl-2 .menu-thumb-2,
.menu-root.hl-3 .menu-thumb-3,
.menu-root.hl-4 .menu-thumb-4 {
  opacity: 1;
  filter: none;
  box-shadow: 0 0 0 2px var(--thumb-ring);
}
/* 中间大图区：全部叠放淡入淡出 */
.menu-big {
  position: absolute;
  inset: 0;
  opacity: 0;
  transform: scale(1.04);
  transition:
    opacity 0.45s cubic-bezier(0.65, 0.05, 0.35, 1),
    transform 0.45s cubic-bezier(0.65, 0.05, 0.35, 1);
}
/* 无悬浮：显示当前区块（.active） */
.menu-big.active {
  opacity: 1;
  transform: scale(1);
}
/* 有悬浮：当前区块让位 */
.menu-root.hl .menu-big.active {
  opacity: 0;
  transform: scale(1.04);
}
/* 显示悬浮项的大图（排在让位之后覆盖） */
.menu-root.hl-0 .menu-big-0,
.menu-root.hl-1 .menu-big-1,
.menu-root.hl-2 .menu-big-2,
.menu-root.hl-3 .menu-big-3,
.menu-root.hl-4 .menu-big-4 {
  opacity: 1;
  transform: scale(1);
}
/* 当前区块链接：置灰 + 下划线标注（颜色走内联样式块，跟 JS 下发） */
.menu-link.is-active {
  position: relative;
  color: #7c8070;
}
.dark .menu-link.is-active {
  color: #8f937f;
}
.menu-link.is-active::after {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  bottom: 6px;
  height: 2px;
  background: currentColor;
}
/* 底部社媒链接：悬浮时底部横线从左向右展开 */
.menu-slink {
  position: relative;
}
.menu-slink::after {
  content: "";
  position: absolute;
  left: 0;
  bottom: -3px;
  width: 100%;
  height: 1px;
  background: currentColor;
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 0.45s cubic-bezier(0.65, 0.05, 0.35, 1);
}
.menu-slink:hover::after {
  transform: scaleX(1);
}
`}</style>
      {/* 中部：左列小图 + 中央放大预览 + 右对齐超大字导航列 */}
      <nav className="flex flex-1 items-center justify-between gap-10 pb-10 pl-6 pr-[7vw] pt-16 lg:pl-[7vw]">
        {/* 左列小图：悬浮对应选项时只高亮（放大交给中央区） */}
        <div className="hidden flex-col gap-4 lg:flex">
          {LINKS.map((link, i) => (
            <a
              key={link.href}
              href={link.href}
              onClick={onClose}
              className={`menu-thumb menu-thumb-${i} block w-56 overflow-hidden rounded-xl ${
                i === activeIndex ? "lit" : ""
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={link.thumbnail}
                alt={link.title}
                loading="lazy"
                className="h-32 w-full object-cover"
              />
            </a>
          ))}
        </div>

        {/* 中央大图区：悬浮哪个选项显示哪个的放大图，无悬浮显示当前区块。
            flex-1 占据左右之间的剩余空间；尺寸走内联 style（绕开 dev CSS 缓存） */}
        <div
          className="relative hidden flex-1 xl:block"
          style={{ height: "clamp(240px, 28vw, 520px)", maxWidth: 780 }}
        >
          {LINKS.map((link, i) => (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              key={link.href}
              src={link.thumbnail}
              alt=""
              aria-hidden
              loading="lazy"
              className={`menu-big menu-big-${i} h-full w-full rounded-2xl object-cover ${
                i === activeIndex ? "active" : ""
              }`}
            />
          ))}
        </div>

        <ul className="ml-auto text-right font-sans text-[clamp(2.6rem,7vw,4.4rem)] font-normal leading-[1.05] lg:ml-0">
          <AnimatePresence>
            {isActive &&
              LINKS.map((link, li) => {
                const dimmed = link.href === activeHref;
                return (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      onClick={onClose}
                      className={`menu-link menu-link-${li} group inline-block py-1 transition-colors ${
                        dimmed ? "is-active" : ""
                      }`}
                    >
                      <span className="flex justify-end overflow-hidden">
                        {link.title.split("").map((ch, ci) => (
                          <motion.span
                            key={ci}
                            initial={{ y: "110%" }}
                            animate={{ y: 0 }}
                            exit={{
                              y: "-110%",
                              transition: {
                                duration: 0.4,
                                ease: LANDO,
                                delay: ci * 0.012,
                              },
                            }}
                            transition={{
                              duration: 0.55,
                              ease: LANDO,
                              delay: 0.25 + ci * 0.035,
                            }}
                            className="inline-block"
                          >
                            <RollChar ch={ch} index={ci} />
                          </motion.span>
                        ))}
                      </span>
                    </a>
                  </li>
                );
              })}
          </AnimatePresence>
        </ul>
      </nav>

      {/* 底部一行：社媒小字（右对齐，悬浮横线从左向右展开）。
          blog 暂无跳转目标，先做成占位按钮 */}
      <div className="flex flex-wrap items-end justify-end gap-4 px-6 pb-8 text-sm md:pr-[7vw]">
        <div className="flex gap-6">
          <a
            href={config.social.github}
            target="_blank"
            rel="noreferrer"
            className="menu-slink"
          >
            github
          </a>
          <span
            className="menu-slink cursor-default"
            title="博客（建设中）"
            aria-disabled
          >
            blog
          </span>
          <a
            href="/assets/resume.pdf"
            target="_blank"
            rel="noreferrer"
            className="menu-slink"
            title="简历（PDF，新标签页打开）"
          >
            resume
          </a>
        </div>
      </div>
    </motion.div>
  );
}

// ---------------- Naresh 风格（备用，未挂载） ----------------

/**
 * 蒙层 + 面板（原项目复刻版）。必须是 header 的直接子级（absolute 定位锚到
 * header），渲染在顶栏条之后。isOpen 关闭时蒙层高度为 0，不占交互。
 */
export function MenuOverlayNaresh({
  isActive,
  onClose,
}: {
  isActive: boolean;
  onClose: () => void;
}) {
  const [selected, setSelected] = useState({ isActive: false, index: 0 });

  return (
    <>
      {/* 蒙层：常驻、height 0↔100dvh 向下擦除（原项目 background 变体）。
          深色定值 + 50% 透明 + 轻模糊；盖满顶栏以下整屏，点击关闭。 */}
      <motion.div
        initial={false}
        animate={{ height: isActive ? "100dvh" : 0 }}
        transition={WIPE}
        onClick={onClose}
        className="pointer-events-auto absolute inset-x-0 top-16 overflow-hidden"
        style={{
          backgroundColor: "hsl(240 10% 3.9% / 0.5)",
          backdropFilter: "blur(6px)",
          WebkitBackdropFilter: "blur(6px)",
        }}
      />

      {/* 菜单面板：height 0→auto 擦除展开，与蒙层同曲线同步 */}
      <AnimatePresence mode="wait">
        {isActive && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            transition={WIPE}
            onClick={onClose}
            className="pointer-events-auto absolute inset-x-0 top-16 z-[1] overflow-hidden"
          >
            <div className="flex min-h-[55dvh] w-full items-center justify-between gap-12 pl-[30px] pr-[20px] pb-10">
              {/* 链接列表：逐字符入场 + 非悬停项模糊 */}
              <div className="flex flex-col items-start">
                {LINKS.map((link, i) => (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={onClose}
                    onMouseOver={() =>
                      setSelected({ isActive: true, index: i })
                    }
                    onMouseLeave={() =>
                      setSelected({ isActive: false, index: i })
                    }
                    className="py-1"
                  >
                    <motion.p
                      animate={{
                        filter:
                          selected.isActive && selected.index !== i
                            ? "blur(4px)"
                            : "blur(0px)",
                        opacity:
                          selected.isActive && selected.index !== i ? 0.6 : 1,
                      }}
                      transition={{ duration: 0.3 }}
                      className="flex overflow-hidden font-display text-4xl font-extrabold uppercase tracking-tight md:text-6xl"
                    >
                      {link.title.split("").map((ch, ci) => (
                        <motion.span
                          key={ci}
                          className="inline-block"
                          initial={{ y: "110%", opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          exit={{
                            y: "110%",
                            opacity: 0,
                            transition: {
                              duration: 0.5,
                              ease: WIPE.ease,
                              delay: (link.title.length - ci) * 0.01,
                            },
                          }}
                          transition={{
                            duration: 0.7,
                            ease: WIPE.ease,
                            delay: ci * 0.02,
                          }}
                        >
                          {ch}
                        </motion.span>
                      ))}
                    </motion.p>
                  </a>
                ))}
              </div>

              {/* 预览小窗：悬停时浮出对应区块截图（≥lg 视口） */}
              <motion.div
                animate={{
                  opacity: selected.isActive ? 1 : 0,
                  scale: selected.isActive ? 1 : 0.95,
                  rotate: selected.isActive ? 0 : -2,
                }}
                transition={{ duration: 0.35 }}
                className="pointer-events-none relative hidden h-[360px] w-[420px] shrink-0 overflow-hidden rounded-2xl border border-border/60 shadow-2xl lg:block"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={LINKS[selected.index].thumbnail}
                  alt={LINKS[selected.index].title}
                  className="h-full w-full object-cover"
                />
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
