"use client";

import React, { useEffect } from "react";
import { ReactLenis, useLenis } from "lenis/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/**
 * Lenis 平滑滚动 + GSAP ScrollTrigger 共用一个时钟。
 *
 * 关键点（原项目踩坑总结）：
 *   1. 每个 Lenis 滚动帧都调 ScrollTrigger.update()——否则 Lenis 自己平滑滚动、
 *      ScrollTrigger 独立采样，一次快速甩动可能跳过某个 trigger 的起始线，
 *      onEnter/onLeaveBack（键盘章节切换全靠它们）就不会触发。
 *   2. Lenis 的 autoRaf 关掉，改由 gsap.ticker 驱动——滚动与补间共享一个时钟；
 *      lagSmoothing(0) 保证掉帧时不会吞掉大段滚动位移。
 */
function SmoothScroll({ children }: { children: React.ReactNode }) {
  const lenis = useLenis(() => ScrollTrigger.update());

  useEffect(() => {
    if (!lenis) return;
    const raf = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);
    return () => gsap.ticker.remove(raf);
  }, [lenis]);

  return (
    <ReactLenis
      root
      autoRaf={false}
      options={{
        duration: 1.2,
        // 锚点导航也走平滑滚动（lenis 1.1.14+ 支持）
        anchors: true,
      }}
    >
      {children}
    </ReactLenis>
  );
}

export default SmoothScroll;
