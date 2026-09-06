"use client";

import { useMemo, type CSSProperties } from "react";

/**
 * 字符轮盘（字符老虎机）——菜单与 Projects 共用。
 *
 * - RollChar（hover 模式）：landonorris.com 同款 text-roll。父级带 .group，
 *   hover 时字符向上滚出、相同副本滚入；与 nav-menu 原实现逐像素一致。
 * - RollCharEnter（入场模式）：lusion.co Featured Work 同款——字符条里预置
 *   若干随机字符，入场（祖先加 .in）时整条下滚落定到真字符，仅播一次、
 *   hover 不重播。滚动距离由 CSS 变量 --spins 驱动（配合 .in 规则）。
 */

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

export function RollChar({ ch, index }: { ch: string; index: number }) {
  return (
    <span className="inline-block h-[1.05em] overflow-hidden align-top">
      <span
        className="flex flex-col transition-transform duration-500 ease-[cubic-bezier(0.65,0.05,0.35,1)] group-hover:-translate-y-1/2"
        style={{ transitionDelay: `${index * 22}ms` }}
      >
        <span className="block h-[1.05em] leading-none">{ch}</span>
        <span className="block h-[1.05em] leading-none" aria-hidden>
          {ch}
        </span>
      </span>
    </span>
  );
}

export function RollCharEnter({
  ch,
  index,
  spins = 5,
}: {
  ch: string;
  index: number;
  spins?: number;
}) {
  // 伪随机条：种子由字符与下标决定，服务端/客户端生成完全一致（避免水合不匹配）。
  // 随机字符绝对定位（不占布局），单元宽度只由目标字符决定——否则最宽的
  // 随机字母会把每个单元撑宽，字符之间出现不均匀的间隙。
  const strip = useMemo(() => {
    let seed = (ch.charCodeAt(0) || 65) * 31 + index * 127 + 7;
    const next = () => {
      seed = (seed * 1103515245 + 12345) % 2147483648;
      return CHARS[seed % CHARS.length];
    };
    return Array.from({ length: spins }, next).concat([ch]);
  }, [ch, index, spins]);
  if (ch === " ") {
    return <span className="inline-block w-[0.28em]" aria-hidden />;
  }
  return (
    <span
      className="relative inline-block h-[1.05em] overflow-hidden align-top"
      aria-label={ch}
    >
      {/* 隐形占位：单元格宽度 = 目标字符宽度（随机字符不参与布局，不会撑出间隙） */}
      <span className="invisible block h-[1.05em] leading-none">{ch}</span>
      <span
        className="roll-strip absolute inset-x-0 top-0 will-change-transform"
        style={
          {
            "--spins": spins,
            height: `${(spins + 1) * 1.1}em`,
            transitionDelay: `${350 + index * 28}ms`,
          } as CSSProperties
        }
      >
        {strip.map((c, i) => (
          <span
            key={i}
            className="absolute left-0 block h-[1.05em] leading-none"
            style={{ top: `${i * 1.1}em` }}
            aria-hidden
          >
            {c}
          </span>
        ))}
      </span>
    </span>
  );
}
