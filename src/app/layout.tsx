import type { Metadata } from "next";
import { Space_Grotesk, Unbounded } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";
import { config } from "@/data/config";
import { Header } from "@/components/header";

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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${spaceGrotesk.variable} ${unbounded.variable} font-sans`}
    >
      <head>
        {/* Spline 运行时会从 unpkg 拉取 wasm，提前预热连接可加快 3D 场景启动。
            若你的部署环境访问 unpkg 困难，见 README「常见问题」。 */}
        <link rel="preconnect" href="https://unpkg.com" crossOrigin="anonymous" />
      </head>
      <body>
        {/* attribute="class" 必须显式声明：next-themes 0.4 默认用 data-theme，
            而 Tailwind darkMode 和 globals.css 的变量都依赖 .dark 类 */}
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <Header />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
