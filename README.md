# Personal Portfolio — Next.js + Spline 3D 键盘

参照 [nareshkhatri.dev](https://nareshkhatri.dev/)（[源码](https://github.com/Naresh-Khatri/3d-portfolio)）的架构搭建的
交互式 3D 键盘个人主页脚手架：技能被做成 3D 键盘的键帽，按下物理按键或悬停
键帽即可查看技能；滚动页面时键盘随章节变换位置/角度，完成"滚动叙事"。

## 快速开始

```bash
npm install
npm run dev
```

打开 http://localhost:3000 。此时还没有 3D 场景文件，技能区会以 HTML 卡片
网格展示（渐进增强，属正常现象）。按 **SPLINE-GUIDE.md** 在 Spline 编辑器里
做好键盘、导出放到 `public/assets/keyboard.spline` 后，3D 模式自动启用。

## 架构一览

```
src/
├── app/
│   ├── layout.tsx            # 字体、主题、header
│   ├── page.tsx              # 三明治结构：3D 画布(下层,fixed) + HTML 内容(上层)
│   └── globals.css           # 主题变量 + canvas-overlay-mode 指针穿透
├── components/
│   ├── keyboard-canvas.tsx   # ⭐ 核心：Spline 加载、按键→技能、滚动叙事、动画
│   ├── keyboard-states.ts    # 各章节键盘的 scale/position/rotation 状态表
│   ├── smooth-scroll.tsx     # Lenis + GSAP ScrollTrigger 共时钟
│   ├── header.tsx / theme-toggle.tsx / section-header.tsx
│   └── sections/             # hero / skills / experience / projects / contact
├── data/
│   ├── config.ts             # ⭐ 你的名字、邮箱、社交链接、场景路径
│   ├── skills.ts             # ⭐ 技能字典（key = Spline 键帽名）
│   └── content.ts            # ⭐ 经历与项目内容
├── hooks/
│   ├── use-perf-profile.ts   # 降级判定（reduced-motion / 省流模式）
│   ├── use-keyboard-scene.ts # 场景文件存在性检测（缺失→HTML 网格）
│   ├── use-keycap-sound.ts   # Web Audio 合成按键音（无音频文件）
│   └── use-media-query.ts
└── lib/utils.ts
```

**核心机制**（详见代码注释）：

- **命名契约**：Spline 场景里名为 `keyboard` 的组 + 每个键帽以技能 key 命名
  （`js`/`ts`/`react`…）。事件回调用 `e.target.name` 查 `SKILLS` 字典。
- **滚动叙事**：ScrollTrigger 的 `onEnter/onLeaveBack` → 查 `STATES` 状态表 →
  `gsap.to` 补间键盘的 transform；各章节还有专属动画（hero 慢转、contact 拆解漂浮）。
- **指针穿透**：内容层 `pointer-events: none` + 对真实内容元素恢复 `auto`，
  空白处点击直达下层 3D 画布。
- **降级哲学**：只在用户明确要求（reduced-motion / Data Saver）或场景文件缺失时
  摘除 3D，不猜测设备能力；高分屏 DPR 钳制、后台标签页暂停渲染。

## 修改你自己的内容

1. `src/data/config.ts` — 名字、邮箱、GitHub/LinkedIn 链接
2. `src/data/skills.ts` — 技能列表（改了记得同步 Spline 键帽，见指南第 3 节）
3. `src/data/content.ts` — 经历、项目
4. 各 section 组件里的文案

## 常见问题

**3D 场景不出现？**
打开 DevTools Network 看 `/assets/keyboard.spline` 是否 404（文件没放或路径不对）；
确认对象命名完全符合 SPLINE-GUIDE.md 的契约（尤其组名 `keyboard`、键帽名与
skills.ts 的 key 一致）。

**国内部署时 3D 加载慢/失败？**
Spline 运行时会从 unpkg.com 拉取若干 wasm 模块（navmesh/modelling/boolean 等）。
若目标用户网络访问 unpkg 困难，可考虑：给站点加 Service Worker/CDN 代理这些
请求，或改用 Spline 官方托管场景 URL（`scene` 传远程地址）。本机开发一般无碍。

**留言板消息重启就丢？**
默认是内存模式（零配置可用）。要持久保存：到 [upstash.com](https://upstash.com)
注册（免费 1 万次请求/天）→ 创建 Redis 数据库 → 把 REST URL 和 TOKEN 填进
`.env.local` 的 `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`，
重启 dev server。配置后自动切换到 Redis 存储，响应里的 `storage` 字段
会从 `memory` 变成 `redis` 可用于确认。

**Node 版本注意（本机踩过）**
本项目需要 Node ≥ 18.18（建议 20+）。本机 nvm 的全局软链曾被切到 Node 14
导致依赖被旧 npm 污染。若 `node --version` 不是 20+，先 `nvm use 24.9.0`
（需要管理员权限的终端；或用管理员重建软链）。

**亮色模式下想完全遮住 3D（原站行为）？**
`src/app/page.tsx` 里把 `bg-background/85` 改成 `bg-background`。

**音效不响？**
浏览器自动播放策略要求用户手势后才出声——先按一次键或点击页面即可；
纯 hover 在首次手势前可能被静音，属预期。

## 致谢

架构与交互设计参考 [Naresh Khatri 的 3D portfolio](https://github.com/Naresh-Khatri/3d-portfolio)，
建议保留页脚的 credit 链接。
