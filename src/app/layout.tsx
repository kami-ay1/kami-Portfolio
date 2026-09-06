import type { Metadata } from "next";
import { Space_Grotesk, Unbounded } from "next/font/google";
import "./globals.css";
import { config } from "@/data/config";
import { Header } from "@/components/header";
import { ThemeProvider } from "@/components/theme-provider";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const unbounded = Unbounded({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: config.title,
  description: config.description,
};

/**
 * 主题策略：暗色是站点默认并直接服务端渲染进 <html>（无脚本、无开发警告、无闪烁）。
 * 偏好亮色的访客由 ThemeProvider 在水合时切到亮色（会有一瞬暗→亮过渡）。
 * 存储键与旧 next-themes 兼容（localStorage "theme": "dark" | "light"）。
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`dark ${spaceGrotesk.variable} ${unbounded.variable} font-sans`}
    >
      <head>
        {/* Spline 运行时会从 unpkg 拉取 wasm，提前预热连接可加快 3D 场景启动。
            若你的部署环境访问 unpkg 困难，见 README「常见问题」。 */}
        <link rel="preconnect" href="https://unpkg.com" crossOrigin="anonymous" />
      </head>
      <body>
        <ThemeProvider>
          <Header />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
