/**
 * 站点全局配置 —— 你的个人信息都集中在这里改。
 * 技能列表在 src/data/skills.ts，经历/项目在 src/data/content.ts。
 */
export const config = {
  /** 你的名字（hero 大标题按空格拆成两行） */
  author: "KaMie",
  role: "Full Stack Developer（全栈工程师）",
  /** 站点域名（部署后替换；暂未定） */
  site: "https://your-domain.com",
  title: "KaMie — Full Stack Developer",
  description:
    "Personal portfolio with an interactive 3D keyboard built with Spline.",

  /**
   * Spline 场景文件路径。
   * 按 SPLINE-GUIDE.md 在 Spline 编辑器里做好键盘后，导出的场景文件
   * （新版编辑器导出为 .splinecode）放到 public/assets/keyboard.splinecode
   * 即可（文件丢失时站点自动退化为 HTML 网格）。
   */
  sceneUrl: "/assets/keyboard.splinecode",

  /**
   * 背景音乐（顶栏音乐开关用）。放一份免版税音频到 public/assets/，
   * 想换成真歌就改这里的 url。
   * 当前曲目：Lo-Fi Waves — Marco Conti (VelarioMusic)，来自 Pixabay
   * （免版税许可，可商用，无需付费；站点 footer 已附署名）。
   * 浏览器策略：不会自动播放，访客点顶栏音乐按钮后才开始。
   */
  bgm: { url: "/assets/bgm.mp3", volume: 0.35 },

  /**
   * 联系方式（Contact 区"联系信息行"用：点击复制，邮箱行可 mailto）。
   * 注意：表单邮件实际投递到 .env.local 的 CONTACT_TO（Resend 测试模式
   * 只能发到账号邮箱，验证域名后再切换）；这里展示的是对外邮箱。
   */
  contact: {
    wechat: "StayMello",
    phone: "17816762599",
    email: "17816762599@163.com",
  },

  social: {
    github: "https://github.com/kami-ay1",
    /** 未提供 LinkedIn，页面已全部移除该入口 */
    linkedin: "",
    email: "mailto:17816762599@163.com",
  },
} as const;
