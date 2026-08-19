"use client";

import * as React from "react";

/**
 * 检测 Spline 场景文件是否存在（public/assets/keyboard.splinecode）。
 *
 * 场景是你自己在 Spline 编辑器里导出后放进来的；文件还没放时站点必须
 * 照常工作（技能区退化为 HTML 网格）。用模块级 store + useSyncExternalStore，
 * 让键盘画布和技能区块共享同一次检测结果。
 */
export type SceneStatus = "checking" | "available" | "missing";

let status: SceneStatus = "checking";
let initialized = false;
const listeners = new Set<() => void>();

const notify = () => listeners.forEach((l) => l());

export function checkKeyboardScene(url: string) {
  if (initialized || typeof window === "undefined") return;
  initialized = true;
  fetch(url, { method: "HEAD" })
    .then((res) => {
      status = res.ok ? "available" : "missing";
    })
    .catch(() => {
      status = "missing";
    })
    .finally(notify);
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useKeyboardScene(): SceneStatus {
  return React.useSyncExternalStore(
    subscribe,
    () => status,
    () => "checking" as SceneStatus
  );
}
