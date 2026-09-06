# 需求文档 — 3D 键盘个人作品集

> 版本 v1.0 · 2026-09-06 · 配套设计原型：[public/design/prototype.html](public/design/prototype.html)（11 段，含可交互演示）
> 实施顺序：未完成部分（§4）以原型验收通过的方案为准；已完成部分（§3）不再改动。

---

## 1. 项目概述

- **目标**：Lusion 风格的个人作品集站点，核心亮点为可交互 3D 键盘。
- **技术栈**：Next.js（App Router）· TypeScript · Tailwind CSS · Spline 3D · GSAP + ScrollTrigger · Lenis 平滑滚动 · next-themes · Resend（邮件）· Upstash（限流）。
- **参考来源**：
  | 来源 | 借鉴内容 |
  | --- | --- |
  | naresh-3d-portfolio（源模板） | 3D 键盘场景、留言板、整体骨架 |
  | lusion.co | Featured Work 两列排版、字符轮盘、巨字宣言、音乐开关、弹性光标 |
  | landonorris.com | 全屏菜单（橄榄色面板 / clip-path 擦除 / 文字上滚 / Lando 曲线） |
  | kasane-keyboard.com | 极简下划线表单、Preloader 百分比门禁、Footer 一行式 |
  | manayerbamate.com | 留白与排版节奏 |

---

## 2. 设计 Tokens（原型 01 段，全站统一）

### 色彩
| Token | 值 | 用途 |
| --- | --- | --- |
| `--bg` | `#101014` | 暗色底 |
| `--fg` | `#f4f4ed` | 主文字 |
| `--muted` | `#9b9b8f` | 次级文字 |
| `--olive` / `--olive-lt` / `--olive-dim` | `#2c2f20` / `#dde1d2` / `#8f937f` | 菜单橄榄面板三色（暗色模式；亮色模式面板为 `#E4E7D9`） |
| `--accent` | `#5865f2`（原型演示） / `#aab6f5`（巨字强调） | 强调色 |
| 亮色模式 | `#F4F4F0` 底 + 深字 | next-themes 切换 |

### 运动曲线（三条，全站复用）
| 名称 | 曲线 | 用途 |
| --- | --- | --- |
| Lando | `cubic-bezier(0.65, 0.05, 0.35, 1)` | 菜单擦除、文字滚动、hover、行遮罩升起 |
| Wipe | `cubic-bezier(0.76, 0, 0.24, 1)` | 整屏擦出（菜单关闭回色、Preloader 退场） |
| 回弹 | `cubic-bezier(0.34, 1.56, 0.64, 1)` / `elastic.out` | 成功打勾、键帽弹起、光标释放 |

### 光标行为规范（原型 10 段总表）
- 弹性光标**包裹 + 磁吸**：顶栏按钮、Hero 按钮、Contact CTA、Experience/Projects 卡片上的**箭头**。
- 光标**不包裹**：菜单大字（逐字上滚是自身动效）、菜单缩略图、Experience/Projects 行卡本体。
- **系统光标区**（`data-no-custom-cursor="true"`）：聊天面板、所有弹窗、3D 键帽拾取区。
- 移动端 / `pointer: coarse`：光标组件整体不渲染。

---

## 3. 已完成部分（现状，不再改动）

| 模块 | 说明 | 关键文件 |
| --- | --- | --- |
| 顶栏 | 左右间距 `pl-[30px] pr-[20px]`；按钮无边框，悬浮中心晕开着色 8%（btn-fill）；菜单打开时整栏透明，关闭等 menu 完全收起再渐回底色（barHold 750ms） | `src/components/header.tsx` |
| 弹性光标 | 源项目 ElasticCursor 忠实移植：elastic 弹簧、速度形变、包裹形状自适应圆角、磁吸拉力上限 `clamp(w*0.18, 12, 22)`px | `src/components/elastic-cursor.tsx` |
| 全屏菜单 | Lando 式：橄榄面板 clip-path 擦入 0.75s、右侧 70px 大字逐字上滚、左侧缩略图联动 + 中央大图、当前区高亮下划线（长度随文字）、右下 github·blog·resume 划线动效（blog 为占位，跳转后补；resume 打开 public/assets/resume.pdf，更新简历直接替换该文件）、打开时锁定 Lenis 滚动、5 张预览缩略图已按新内容重截（?v=2 缓存穿透）| `src/components/nav-menu.tsx` |
| 3D 键盘 + 技术栈 | 键盘滚动编排（home→中心）；悬浮键帽经 Spline 场景变量显示 3D 文字面板（暗/亮 × 移动/桌面 4 变体可见性门控）；Tech Stack 标题随滚动从左上角横移至水平居中，行遮罩升起入场（与键盘共用 ScrollTrigger） | `src/components/keyboard-canvas.tsx`、`src/components/sections/skills.tsx` |
| 留言板 | "N people here" 常显 + 悬浮展开 "let's chat"；资料弹窗：名字 + 100 个本地头像（DiceBear lorelei-neutral，`public/assets/avatars/guest-*.svg`）+ 强调色 | `src/components/guestbook/*` |
| 音乐开关 | 均衡器按钮：静止四根等宽等长满高柱条；播放随机跳动（每根独立关键帧/时长/负延迟）；进页自动播放：先尝试出声播放，被浏览器策略拒绝则静音起播、首次点击/按键/触屏解除静音（现代浏览器不允许完全绕过策略）；音源 `public/assets/bgm.mp3`（Lo-Fi Waves — Marco Conti，Pixabay 免版税，footer 已署名），配置在 `config.bgm` | `src/components/music-toggle.tsx` |
| 邮件发送 | `/api/contact`：zod 校验（名字≥2、邮箱、留言≥10）、每 IP 3 条/分钟（Upstash）、Resend 直投 + replyTo、未配置时 503 回退 mailto | `src/app/api/contact/route.ts` |
| 主题切换 | 自研 ThemeProvider（暗色为服务端默认；next-themes 在 React 19 下有脚本水合警告，已移除）；View Transitions 圆形 reveal 保留 | `src/components/theme-provider.tsx`、`src/components/theme-toggle.tsx` |
| **Experience 编号行** ✅ 2026-09-06 | 编号行列表替代时间线；行遮罩升起 stagger；hover 右移 + ↗（光标包裹箭头） | `src/components/sections/experience.tsx` |
| **Projects 两列卡** ✅ 2026-09-06 | Lusion Featured Work 两列；clip 展开入场 + 字符轮盘落定（roll-char.tsx 共享组件）；hover 仅图提亮 + 箭头滑入；点击弹层看 STAR（方案 B）；暂用占位渐变图 | `src/components/sections/projects.tsx`、`src/components/roll-char.tsx` |
| **Contact + Footer** ✅ 2026-09-06 | 巨字宣言 "Let's work / together" + Say Hello 磁吸 CTA；联系信息三行（微信/手机/邮箱，点击复制 ✓）；表单弹窗换皮（下划线输入/校验红线/三点发送/✓ 回弹，功能层不动）；一行式 Footer + Back to top | `src/components/sections/contact.tsx`、`src/components/contact-rows.tsx`、`src/components/contact-modal.tsx` |
| **滚动指示条** ✅ 2026-09-06 | 右缘 3px 细轨道 + 比例滑块（lusion 同款）；滚动出现、停止 1.1s 淡出；原生滚动条已全局隐藏 | `src/components/scroll-progress.tsx` |
| **Preloader** ✅ 2026-09-06 | 键帽按压 + 百分比；仅会话首访（sessionStorage + StrictMode ref 防双调用）；键帽回弹 → 整屏上擦（Wipe 0.75s）；加载期锁 Lenis | `src/components/preloader.tsx` |

---

## 4. 待实现需求（已确认，全部实施）

> **实施决定（2026-09-06）**：四个模块全部实现；Projects 图片由用户提供截图；联系信息三行（微信/手机/邮箱）全上；Preloader 做完整版。

### 4.1 Experience 重设计（原型 06）
- 时间线改为**编号行列表**：`01 / 职位 / 公司` + 右侧时间段 + 描述 + 技能 chips 内联。
- 入场：行遮罩升起（Lando，逐行 stagger）。
- hover：整行亮起 + 右移（padding-left 过渡）+ 箭头 ↗ 出现（**箭头**被光标包裹，行本体不包裹）。
- 数据源：`src/data/content.ts` 的 `EXPERIENCE`（现为占位，见 §5）。

### 4.2 Projects 重设计（原型 07，Lusion Featured Work 实测还原）
- **两列网格**：12 列制 span 6；第 3 张起交错下垂（`nth-child(n+3)` 上边距）；图区 `padding-top: 65%`、圆角 15px。
- **入场**（滚动触发，一次性）：卡片升起（y 60→0，0.9s）+ 图区 clip-path `inset(8% 6%) → inset(0)`（1.1s）+ 名称**字符轮盘**逐字滚入落定（hover 不重播——原站实测）。
- **hover**：仅图片提亮（brightness .75→1.05）+ 箭头 → 从名称左侧滑入（文字本身零样式变化）。
- **STAR 详情（已定方案 B）**：卡片保持极简，点击打开详情弹层展示 `highlights` 四条（背景/任务/行动/结果 彩色胶囊前缀）。
- 数据源：`PROJECTS`；**图片由用户提供截图**（放到 `public/assets/projects/`，未就绪前先挂占位渐变）。

### 4.3 Contact 重设计（原型 08）
- **巨型宣言**："Let's work / together" 两行行遮罩升起（第二行强调色），取代现顶栏小标题，避免重复。
- **Say Hello** 药丸 CTA：光标包裹 + 磁吸，点击打开表单弹窗。
- **联系信息三行**（已确认全上，CTA 下方）：微信号 / 手机 / 邮箱；点击复制 + "✓ copied" 反馈；邮箱行可 mailto；行遮罩入场，hover 背景微亮。Hire Me 保持锚点跳转 Contact 不变。
- **表单弹窗重设计**（功能层不动，只换 UI）：
  - 下划线式输入框（无框），聚焦底线从左向右展开 0.4s，label 浮起；
  - 校验失败：底线变红 + 错误文案行遮罩升起；
  - 提交：文字淡出 → 圆点点动（发送中）→ 成功后表单擦出、✓ 回弹打勾；
  - 顶部彩条改橄榄色单色细条；字数计数器右下角常显；
  - 入场 scale .95→1 + y 16→0（Lando 0.3s）；Esc / 点击遮罩关闭；弹窗内为系统光标区。
- **Resend 注意**：测试模式下只能投递到账号邮箱 `1598362368@qq.com`；验证自有域名后才能发给任意访客回信目标以外的地址。`.env.local` 已配置 `RESEND_API_KEY` / `CONTACT_TO`。

### 4.4 Footer（原型 08）
- 一行式极简：`© 名字 · github · email · 3D scene credit: Naresh Khatri · Back to top ↑`。
- 保留音乐署名行（Music by Marco Conti from Pixabay）。LinkedIn 已按要求移除（hero/menu 内如需另议）。

### 4.5 Preloader（原型 09）
- 首访加载屏：**键帽按压 + 百分比**——等宽数字滚到 100% 驱动键帽下压；加载完键帽回弹（回弹曲线）→ 整屏 clip-path 向上擦出（Wipe 0.75s）→ 键盘 hero 入场衔接。
- 仅首次访问显示（sessionStorage 会话内不重复）；资源就绪但 <800ms 直接放行，避免快网闪烁。

---

## 5. 内容占位（2026-09-06 已收集大部分真实内容）

| 项 | 位置 | 状态 |
| --- | --- | --- |
| 名字 / 职位 | `src/data/config.ts` | ✅ KaMie / Full Stack Developer（全栈工程师） |
| 邮箱 / GitHub | `src/data/config.ts` `social` | ✅ 17816762599@163.com / github.com/kami-ay1 |
| 微信号 / 手机号 | `src/data/config.ts` `contact`（新增） | ✅ StayMello / 17816762599 |
| 工作经历 3 段 | `src/data/content.ts` `EXPERIENCE` | ✅ 西软（实习 + 组件库）×2、天柚 ×1；天柚描述按四个项目仓库的**本人提交记录**（37 + 5 条）与产品线亮点提炼，措辞见 content.ts |
| 项目 4 个（STAR） | `src/data/content.ts` `PROJECTS` | ✅ CRM 后台 / 营销 H5 / 店务小程序 / 电商小程序（crm_next、crm_embed、mp_dw、mp_ecshop）；截图后补（`image` 字段已预留，未提供前用占位渐变） |
| 菜单 5 张预览缩略图 | `src/components/nav-menu.tsx` LINKS | ✅ 已按新内容重截（?v=2 缓存穿透） |
| 站点域名 | `src/data/config.ts` `site` | ⬜ 未定，保持占位 |
| favicon | `src/app/` | ⬜ 缺失 |
| 简历 PDF | `public/assets/resume.pdf` | ✅ 前端开发.pdf 已导入（菜单 resume 按钮打开；换简历直接覆盖此文件） |

---

## 6. 技术约束与注意事项

1. **dev 模式 CSS 缓存**：`next dev` 的 CSS chunk 无内容 hash，改动易不生效——组件级样式用组件内联 `<style>` 或 `style` 属性（现有 nav-menu / header / music-toggle 均如此），生产构建不受影响。
2. **React 合成 hover / `:has()` 不可靠**：菜单等复杂 hover 用原生事件委托 + 内联样式实现，新增交互沿用此模式。
3. **GSAP 与 CSS transition 冲突**：被光标磁吸的元素禁止 `transition-all`（会拦截 GSAP transform 写入），只 transition 颜色类属性。
4. **头像必须走本地文件**：DiceBear 在线 API 会被限流导致头像消失；换风格时用 `scripts/generate-avatars.mjs` 重新生成本地 SVG（`backgroundColor: []` 保持透明底）。
5. **行遮罩动画**：文字入场用 `overflow:hidden` + `translateY(110%)→0`（y 字符串），不要 `yPercent`（会与内联 transform 双重叠加）。
6. **浏览器自动播放策略**：BGM 不自动播放，仅点击后出声；音频加载失败静默回关闭态。
7. **移动端降级**：Spline 场景缺失或移动端时自动退化为 HTML 网格；弹性光标、3D 文字面板等按 `(pointer: fine)` / 断点门控。
8. **密钥安全**：`.env.local` 已 gitignore，不提交；换 Resend key 时同步更新 `CONTACT_TO`。

---

## 7. 验收标准

以下逐项通过即视为完成（与原型 11 段清单一致）：

- [x] 设计 Tokens：暗/亮/橄榄三套色彩、字体阶梯、三条运动曲线全站一致。
- [x] Experience：编号行列表、入场行遮罩 stagger、hover 右移点亮 + 箭头 ↗（2026-09-06 实施并验证）。
- [x] Projects v3.1：两列卡；入场 clip 展开 + 字符轮盘落定；hover 仅图提亮 + 箭头滑入（文字零变化）；STAR 弹层方案 B（2026-09-06 实施并验证；图待截图替换）。
- [x] Contact：巨型宣言 "Let's work together"；表单弹窗下划线输入 + 校验 + 发送/成功动效；联系三行点击复制（2026-09-06 实施并验证）。
- [x] Hire Me 保持锚点跳转 Contact 区。
- [x] Footer：一行式极简（含场景 credit + 回顶部 + 音乐署名）（2026-09-06 实施并验证）。
- [x] Preloader：键帽按压 + 百分比，仅首访显示，退场衔接（2026-09-06 实施并验证三路径）。
- [x] 弹性光标包裹/不包裹区域符合 §2 规范表；聊天/弹窗内为系统光标。
- [x] 邮件链路：校验 → 限流 → Resend 发送成功（或 503 回退 mailto）。
- [ ] §5 占位内容全部替换为真实内容后全站走查（亮/暗 × 桌面/移动四组合）——剩余：项目截图、菜单预览图重截、域名、favicon。
