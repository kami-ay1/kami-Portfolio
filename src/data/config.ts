/**
 * 站点全局配置 —— 你的个人信息都集中在这里改。
 * 技能列表在 src/data/skills.ts，经历/项目在 src/data/content.ts。
 */
export const config = {
  /** 你的名字（hero 大标题按空格拆成两行） */
  author: "Your Name",
  role: "Full Stack Developer",
  site: "https://your-domain.com",
  title: "Your Name — Full Stack Developer",
  description:
    "Personal portfolio with an interactive 3D keyboard built with Spline.",

  /**
   * Spline 场景文件路径。
   * 按 SPLINE-GUIDE.md 在 Spline 编辑器里做好键盘后，导出的场景文件
   * （新版编辑器导出为 .splinecode）放到 public/assets/keyboard.splinecode
   * 即可（文件丢失时站点自动退化为 HTML 网格）。
   */
  sceneUrl: "/assets/keyboard.splinecode",

  social: {
    github: "https://github.com/yourname",
    linkedin: "https://www.linkedin.com/in/yourname",
    email: "mailto:you@example.com",
  },
} as const;
