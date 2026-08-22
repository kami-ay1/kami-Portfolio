"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";

/**
 * 右上角 Menu —— 悬浮预览导航（严格对齐原项目的结构）。
 *
 * 原项目的做法（header.module.scss + anim.ts）：
 *   1. 蒙层是 header 的常驻子元素，定位在顶栏下沿（top: 100%），
 *      用 height 0 ↔ 100dvh 做向下擦除，与菜单面板共用同一条
 *      贝塞尔曲线 cubic-bezier(0.76, 0, 0.24, 1)（1s），开关完全同步可逆。
 *   2. 蒙层颜色是定值 hsl(240 10% 3.9%) 配 opacity 0.5（页面内容透出来）；
 *      backdrop 模糊只作用于顶栏条本身。这里按需求追加了轻模糊。
 *   3. 蒙层盖满顶栏以下整屏，点击即关闭——背景完全不可交互。
 *   4. 链接标题逐字符上浮入场；悬停时其余链接 blur(4px)，右侧浮出
 *      该区块预览小窗（≥lg 视口）。
 */

type NavLink = { title: string; href: string; thumbnail: string };

const LINKS: NavLink[] = [
  { title: "Home", href: "#hero", thumbnail: "/assets/nav-link-previews/hero.png" },
  { title: "Skills", href: "#skills", thumbnail: "/assets/nav-link-previews/skills.png" },
  { title: "Experience", href: "#experience", thumbnail: "/assets/nav-link-previews/experience.png" },
  { title: "Projects", href: "#projects", thumbnail: "/assets/nav-link-previews/projects.png" },
  { title: "Contact", href: "#contact", thumbnail: "/assets/nav-link-previews/contact.png" },
];

/** 原项目同款擦除曲线 */
const WIPE = { duration: 1, ease: [0.76, 0, 0.24, 1] as const };

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
      className="pointer-events-auto flex h-6 select-none items-center gap-3"
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

/**
 * 蒙层 + 面板。必须是 header 的直接子级（absolute 定位锚到 header），
 * 渲染在顶栏条之后。isOpen 关闭时蒙层高度为 0，不占交互。
 */
export function MenuOverlay({
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
            <div className="flex min-h-[55dvh] w-full items-center justify-between gap-12 px-6 pb-10 md:px-16 lg:px-24 xl:px-28">
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
