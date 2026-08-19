"use client";

import * as React from "react";

/**
 * 性能与降级画像 —— 决定"特效开多猛"的唯一事实来源。
 *
 * 哲学（学自原项目）：只根据用户的**明确意图**降级，不猜测设备能力。
 * 浏览器的 hardwareConcurrency / deviceMemory 上报极不可靠（同一台机器
 * 不同会话可能报 12 核或 2 核），据此砍掉 3D 会误伤大量完全够用的设备。
 * 因此只有两种情况彻底禁用 3D：
 *   1. 系统 prefers-reduced-motion: reduce
 *   2. navigator.connection.saveData（用户开了省流模式）
 * 视口大小只影响画质（粒子数、DPR 上限），不摘除场景。
 */
export type PerfProfile = {
  reducedMotion: boolean;
  isMobile: boolean;
  /** 彻底禁用 3D 场景（退化为 HTML 技能网格） */
  disable3D: boolean;
  /** 跳过纯装饰性特效（粒子背景等） */
  disableDecorative: boolean;
  /** 粒子背景数量（0 = 不渲染；移动端少放，省电） */
  particleCount: number;
  /** 画布 devicePixelRatio 上限（高分屏省 GPU 的关键） */
  maxDpr: number;
  /** 客户端检测已完成（避免 SSR/CSR 不一致） */
  ready: boolean;
};

function detectSaveData(): boolean {
  if (typeof navigator === "undefined") return false;
  return (
    (navigator as Navigator & { connection?: { saveData?: boolean } })
      .connection?.saveData ?? false
  );
}

export function usePerfProfile(): PerfProfile {
  const [state, setState] = React.useState({
    reducedMotion: false,
    isMobile: false,
    saveData: false,
    ready: false,
  });

  React.useEffect(() => {
    const motionMq = matchMedia("(prefers-reduced-motion: reduce)");
    const mobileMq = matchMedia("(max-width: 768px)");

    const update = () =>
      setState({
        reducedMotion: motionMq.matches,
        isMobile: mobileMq.matches,
        saveData: detectSaveData(),
        ready: true,
      });

    update();
    motionMq.addEventListener("change", update);
    mobileMq.addEventListener("change", update);
    return () => {
      motionMq.removeEventListener("change", update);
      mobileMq.removeEventListener("change", update);
    };
  }, []);

  const { reducedMotion, isMobile, saveData, ready } = state;

  return React.useMemo<PerfProfile>(
    () => ({
      reducedMotion,
      isMobile,
      disable3D: reducedMotion || saveData,
      disableDecorative: reducedMotion,
      particleCount: reducedMotion ? 0 : isMobile ? 30 : 100,
      maxDpr: isMobile ? 1.5 : 2,
      ready,
    }),
    [reducedMotion, isMobile, saveData, ready]
  );
}
