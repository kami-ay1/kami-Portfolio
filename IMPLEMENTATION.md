# 实施设计 — Experience / Projects / Contact+Footer / Preloader

> v1.0 · 2026-09-06 · **本文档是代码级实施方案，经你确认后才开始改代码。**
> 上游文档：[REQUIREMENTS.md](REQUIREMENTS.md)（需求与 Tokens）· [public/design/prototype.html](public/design/prototype.html)（交互原型）
> 原则：已有组件（光标 / 菜单 / 顶栏 / 留言板 / 键盘 / 音乐开关）一律不动；每完成一个模块给你截图验收，通过后再做下一个。

---

## 0. 内容现状（已就位，等待这些模块消费）

- `src/data/config.ts`：KaMie / Full Stack Developer（全栈工程师）/ 邮箱 / GitHub / `contact.wechat="StayMello"`、`contact.phone="17816762599"`（本次为联系信息行新增的字段）。
- `src/data/content.ts`：经历 3 段（西软实习、西软组件库、天柚）+ 项目 4 个（CRM 后台 / 营销 H5 / 店务小程序 / 电商小程序），项目新增 `highlights[]`（STAR 四条）与 `image?`（截图路径，暂空 → 占位渐变）。
  > ⚠️ 「天柚」一段的描述是我按四个项目仓库推断的，你过目确认或改。

---

## 1. Experience 编号行列表

**改动文件**：`src/components/sections/experience.tsx`（原地重写）；数据不动。

| 项 | 设计 |
| --- | --- |
| 结构 | 删时间线 `<ol>`（竖线+圆点），改原型 `.spec-row` 式行：`grid: 编号64px + 内容1fr + 时间auto`；行内：标题（职位 @ 公司）→ 描述 bullets → 技能 chips |
| 编号 | `01 / 02 / 03`，橄榄灰 `#8f937f` 小字 |
| 入场 | 每行套 `overflow:hidden` 壳，内层 `translateY(110%) → 0`；ScrollTrigger 一次性触发（`top 85%`），行间 stagger 0.08s，Lando 0.7s |
| hover | 行 `padding-left 12→22px` + 背景微亮，0.4s Lando；右侧 ↗ 淡入上移 |
| 光标 | **箭头**加 `.cursor-can-hover`（光标包裹磁吸），**行本体不加**（与规范表一致） |
| 可读性 | 保留现有「亮色模式局部毛玻璃底」容器方案，不动 |

## 2. Projects 两列卡（v3.1）

**改动文件**：`src/components/sections/projects.tsx`（原地重写）；新增 `src/components/roll-char.tsx`（共享组件）。

| 项 | 设计 |
| --- | --- |
| 网格 | 两列 `grid-cols-2 gap-10`，第 3 张起 `margin-top` 交错下垂；移动端单列 |
| 图区 | `padding-top:65%` 撑比例、圆角 15px、`overflow:hidden`；`project.image` 存在用 `<img>`，否则深色渐变占位（135deg `#262733→#191a22`）+ 居中小字 |
| 入场 | 滚动一次性：卡片 y60→0 + 淡入（0.9s）∧ 图区 clip-path `inset(8% 6%)→inset(0)`（1.1s）∧ 名称**字符轮盘**逐字滚入落定；全部 Lando |
| hover | 仅两处：图 `brightness .75→1.05`；箭头 → 在名称左侧滑入（`translateX(-1.1em)→0`），名称整体右移 1.25em。**文字本身零样式变化**（原站实测） |
| 字符轮盘 | 从 `nav-menu.tsx` 抽出 RollChar 逻辑做成 `roll-char.tsx`：菜单用 hover 驱动（现有行为不变），Projects 用「入场自动滚一次落定、hover 不重播」模式（组件加 `mode` prop） |
| 光标 | 箭头 `.cursor-can-hover`；卡片本体不包裹 |
| **STAR 展示（已定：方案 B）** | 卡片保持 Lusion 极简（图 + 标签行 + 轮盘名 + 箭头）；**点击卡片打开详情弹层**：顶部橄榄细条 + 标题 + 技术行 + `highlights` 四行（`背景/任务/行动/结果` 彩色胶囊前缀）；Esc / 点遮罩 / ✕ 关闭；弹层为系统光标区（`data-no-custom-cursor`）；入场 scale .95→1 + y16→0（Lando 0.3s）。原型 07 段有可交互演示 |

## 3. Contact + Footer

**改动文件**：`src/components/sections/contact.tsx`（重写）、`src/components/contact-modal.tsx`（仅 UI 层）、新增 `src/components/contact-rows.tsx`。

### 3.1 Contact 区
- 删现有小标题（`Let's Work Together` 与巨字重复）和「或直接发邮件」链接。
- **巨字宣言**两行 `Let's work` / `together`：行遮罩升起（ScrollTrigger 一次性，第二行延迟 0.15s、强调色）；移动端字号 clamp。
- **Say Hello** 药丸 CTA：`.cursor-can-hover`（光标包裹+磁吸已支持）→ 打开 ContactModal。
- **联系信息三行**（新组件 `contact-rows.tsx`）：微信号 `StayMello` / 手机 `17816762599` / 邮箱 `17816762599@163.com`，读 `config.contact`；点击复制（clipboard API + execCommand 回退）→ 行尾 `✓ copied` 显示 1.2s；邮箱行整行 `<a href="mailto:">`；入场行遮罩升起，hover 背景微亮。

### 3.2 表单弹窗（UI 换肤，功能层零改动）
- 顶部彩条：彩虹渐变 → **橄榄色单色细条**。
- 输入框：去边框圆角，改**下划线式**；label 浮动；聚焦底线 `scaleX(0→1)` 从左向右展开 0.4s Lando。
- 校验失败：底线变红 + 错误文案行遮罩升起（现有 zod 规则不变：名字≥2 / 邮箱格式 / 留言≥10）。
- 提交状态机：idle → 发送中（文字淡出 + 三点跳动）→ 成功（表单擦出 + ✓ 回弹打勾 `cubic-bezier(0.34,1.56,0.64,1)`）；失败回 idle + 错误提示。
- 字数计数器 `0/500` 右下角常显；弹窗入场 `scale .95→1 + y16→0`（Lando 0.3s）；Esc/遮罩关闭、`data-no-custom-cursor` 均保持现状。

### 3.3 Footer（contact 区底部）
- 现两行改为**一行式三段**：`© 2026 KaMie` · `github · email` · `3D scene credit: Naresh Khatri · Back to top ↑`；下方保留小字音乐署名行（Pixabay 许可）。
- Back to top：`lenis.scrollTo(0)`（带 Lando 平滑）。
- linkedin 不出现（已按你要求移除）。

## 4. Preloader（完整版）

**新增文件**：`src/components/preloader.tsx`；`src/app/page.tsx` 挂载（fixed z-200 最顶层）。

- **门禁**：`sessionStorage["preloader-shown"]`——会话内仅首次显示；资源就绪但 <800ms 直接放行，避免快网闪烁。
- **进度**：模拟进度 + 等待键盘场景就绪信号（`use-keyboard-scene` 已有检测钩子可复用），取两者较晚者；百分比等宽字体（`tabular-nums`）滚动。
- **动效**：中央键帽随百分比下压 → 100% 回弹（回弹曲线）→ 整屏 `clip-path inset(0 0 100% 0)` 向上擦出（Wipe 0.75s）→ 卸载节点，键盘 hero 衔接。
- **滚动锁**：loading 期间 `lenis.stop()` + `overflow:hidden`（同菜单打开方案）。
- 可选加分项（默认不做，你点头才加）：光标在 loading 期间变为进度条形态（源项目做法）。

## 5. 收尾（模块全部验收后）

1. 重截菜单 5 张预览缩略图（内容定稿后的页面截图）。
2. 生成 favicon（键帽元素）。
3. `REQUIREMENTS.md` §5 占位表清账（剩：域名、项目截图）。

## 6. 实施顺序与验收流

```
你确认本设计 → ① Experience（截图验收）→ ② Projects（截图验收）
→ ③ Contact+Footer（截图验收）→ ④ Preloader（录屏/走查）→ ⑤ 收尾项
```
每步：`tsc --noEmit` + 亮/暗双主题浏览器走查；单模块完成后停下来等你验收，不连续改动。

## 7. 风险备注

- RollChar 抽共享组件时保持菜单现有 hover 行为像素级不变（回归点）。
- contact-modal 的状态机重构只动视图层；`/api/contact` 的 zod / 限流 / Resend / mailto 回退不碰。
- Projects 入场用一次性 ScrollTrigger（`toggleActions: play none none none`），避免 scrub 与字符轮盘打架。
- 巨字宣言与 Tech Stack 标题一样使用行遮罩，注意各自 trigger 独立，不共享 timeline。
