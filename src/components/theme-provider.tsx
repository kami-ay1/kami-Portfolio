"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

/**
 * 迷你主题提供器（替代 next-themes）：
 *   - next-themes 0.4.6 在 React 19 / Next 16 下会在客户端重渲染 <script>，
 *     触发 "Encountered a script tag" 开发警告（dev 工具 Issues 角标）。
 *   - 本站只需要 attribute="class" + 默认 dark + 手动切换，自己实现更干净：
 *     布局 <head> 里有服务端渲染的初始化脚本（见 app/layout.tsx）负责
 *     首帧无闪烁地挂 .dark 类；这里只管理状态与切换。
 *   - 存储键与取值和 next-themes 完全兼容（localStorage "theme": dark|light），
 *     老用户的选择不会丢。
 */

type Theme = "dark" | "light";
const KEY = "theme";

const ThemeCtx = createContext<{
  resolvedTheme: Theme;
  setTheme: (t: Theme) => void;
}>({ resolvedTheme: "dark", setTheme: () => {} });

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [resolvedTheme, setResolvedTheme] = useState<Theme>("dark");

  useEffect(() => {
    // 水合会按 JSX 重设 <html>，把首帧脚本加的 .dark 抹掉——
    // 挂载时从存储重设一次（与水合同帧，肉眼无感），并以它为初始状态
    let t: Theme = "dark";
    try {
      const s = localStorage.getItem(KEY);
      if (s === "light" || s === "dark") t = s;
    } catch {
      /* 隐私模式忽略 */
    }
    document.documentElement.classList.toggle("dark", t === "dark");
    setResolvedTheme(t);
  }, []);

  const setTheme = useCallback((t: Theme) => {
    document.documentElement.classList.toggle("dark", t === "dark");
    try {
      localStorage.setItem(KEY, t);
    } catch {
      /* 隐私模式忽略 */
    }
    setResolvedTheme(t);
  }, []);

  return <ThemeCtx.Provider value={{ resolvedTheme, setTheme }}>{children}</ThemeCtx.Provider>;
}

export const useTheme = () => useContext(ThemeCtx);
