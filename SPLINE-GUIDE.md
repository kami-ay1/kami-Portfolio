# Spline 3D 键盘制作指南

本项目的 3D 键盘用 [Spline](https://spline.design/)（可视化 3D 设计工具）制作。
你不需要写任何 3D 代码——在 Spline 编辑器里把键盘搭好、按本文的**命名契约**
命名对象、绑好事件，导出 `.spline` 文件放进 `public/assets/` 即可。

---

## 0. 代码与场景的契约（先读这个）

整站逻辑只依赖以下约定，**其余都是你的自由创作空间**：

| 场景中的对象 | 是否必须 | 作用 |
|---|---|---|
| Group，名称 `keyboard` | ✅ 必须 | 整个键盘（含所有键帽）放进这个组。代码靠它做滚动叙事的 transform |
| 键帽对象，名称 = 技能 key（如 `js`、`ts`、`react`…） | ✅ 必须 | 一个键帽 = 一项技能。按下/悬停时代码用对象名查 `src/data/skills.ts` |
| 键帽上的 Key Down / Key Up 事件 | ✅ 必须 | 物理键盘按下 → 3D 键帽动画 + 网页浮层显示技能 |
| 键帽上的 Mouse Hover 事件 | 建议 | 鼠标悬停也能看技能 |
| 场景变量 `heading`（text）、`desc`（text） | 可选 | 若创建，代码会把技能名/描述同步进场景（可在 3D 里放绑定的文字）；不创建则用网页 HTML 浮层兜底 |
| 键帽的"按下/回弹"状态动画 | 建议 | 让物理按键有视觉反馈 |

> 技能 key 列表见 `src/data/skills.ts` 的 `SKILL_KEYS`（js、ts、html、css、react、
> vue、nextjs、tailwind、nodejs、express、postgres、mongodb、git、github、
> docker、linux、nginx、aws、vim、vercel）。
> **增删技能 = 改 skills.ts + 在 Spline 里同步增删同名键帽**，其他代码零改动。

---

## 1. 准备

1. 到 [spline.design](https://spline.design/) 注册（免费版对个人自托管项目够用，
   具体额度以官网定价页为准），建议下载桌面端，编辑大型场景更稳。
2. 新建空场景。画布上默认的方形可以删掉。

---

## 2. 搭键盘

两条路线任选：

**路线 A：社区模板改造（快）**
Spline 社区/模板库搜 "keyboard"，有现成的机械键盘模型。导入后：
把不需要的对象删掉，把你要展示的键帽逐个重命名成技能 key（见第 3 步）。

**路线 B：自己搭（可控，推荐第一次也走这条，量不大）**

1. **外壳**：`+` → Cube，拉扁成长条（如 1000 × 40 × 350），圆角（Fillet）。
   选中后右侧面板命名为 `body`（可选名，仅装饰）。
2. **键帽**：`+` → Cube，约 55 × 30 × 55，Fillet 圆角 8-12，材质给个浅色塑料感。
3. 选中键帽，右侧面板把名称改成技能 key，如 `react`。
4. 复制键帽（Ctrl/Cmd + D），排成键盘阵列；**每个副本都要重命名**。
   排布随意——你的键盘你做主（60% 配列就放 20 个键刚好）。
5. 全选所有东西 `Ctrl/Cmd + G` 打组，把组命名为 **`keyboard`**。
   ⚠️ 组名必须精确是 `keyboard`，代码 `findObjectByName("keyboard")` 靠它工作。

> 尺寸不用纠结：代码会按章节状态表（`src/components/keyboard-states.ts`）
> 对 `keyboard` 组整体缩放/位移/旋转，导出前键盘居中摆正即可。

---

## 3. 绑事件（核心步骤）

Spline 编辑器原生支持 [Key Down / Key Up 事件](https://docs.spline.design/interaction-states-events-and-actions/events/key-down-event)
和 [Mouse Hover 事件](https://docs.spline.design/interaction-states-events-and-actions/events/mouse-hover-event)。
物理按键 → 3D 键帽的联动就靠它们。

**先做一个"完美键帽"再复制**（事件会随对象一起复制，之后只改键位和名字）：

1. 选中一个键帽（如 `react`）。
2. 右侧 **Events 面板** → `+ Add Event` → **Key Down**。
   - **Key Input**：点一下输入框，按键盘上的 **R** 键（把这个物理键绑给该键帽）。
   - **Action**：选 **Transition**，目标选这个键帽自身，做一个"按下"状态
     （见第 4 步的状态做法），时长 0.05-0.1s。
3. 再加 **Key Up** 事件，同样绑 **R** 键，Action 回到初始状态。
4. （建议）再加 **Mouse Hover** 事件：进入 hover 状态（比如微微抬起/变色），
   配一个反向的退出过渡。
5. 预览（右上角 ▶），按 R 键测试键帽动画。

做完第一个键帽后：复制它 → 重命名为下一个技能 key → 双击进它的 Key Down/
Key Up 事件，把 Key Input 换成对应的物理键。20 个键帽即 20 组绑定。

**键位分配建议**：技能 key 和物理键不必对应（`react` 键帽可以绑 R 键），
但一个物理键只能绑一个键帽，避免冲突。参考分配：
`js→J`、`ts→T`、`html→H`、`css→C`、`react→R`、`vue→V`、`nextjs→N`、
`tailwind→Y`、`nodejs→O`、`express→E`、`postgres→P`、`mongodb→M`、
`git→G`、`github→B`、`docker→D`、`linux→L`、`nginx→X`、`aws→A`、
`vim→I`、`vercel→F`。

---

## 4. 键帽"按下"状态（可选但强烈建议）

选中键帽 → 右侧 **States / + Add State** → 新建 `pressed` 状态：
把键帽沿 Y 轴下移 10-15 个单位（模拟键程），或加一点材质变色。
Key Down 事件的 Transition 指向它即可。全场景状态越少越流畅，
一个 pressed + 一个 hover 足够。

---

## 5. 相机与初始摆放

- 选中相机，把 `keyboard` 摆在画面中心偏下、稍微俯视 15-25° 的构图。
- 灯光：一盏主光 + 环境光即可；暗色主题是站点默认，场景底色别做纯白。
- 代码加载后会立刻把 `keyboard` 缩放到极小再弹性放大（入场动画），
  所以编辑器里的初始大小只影响你预览，不影响线上效果。

---

## 6. 导出并接入项目

1. 编辑器右上 **Export / 导出** → 选择导出场景文件下载
   （新版 Spline 导出的是 **`.splinecode`** 文件；界面措辞随版本略有不同，
   找 "Download" 类似选项）。
2. 文件放到本项目并命名为：

```
public/assets/keyboard.splinecode
```

3. `npm run dev` 打开首页——技能区出现 3D 键盘即接入成功；
   按物理键/悬停键帽，底部浮层会显示对应技能。

> 站点启动时会 HEAD 检测该文件：不存在也不报错，技能区自动退化为
> HTML 卡片网格（渐进增强），所以你可以先开发其他部分。

---

## 7. 回到代码侧的调参位置

| 想调什么 | 改哪里 |
|---|---|
| 技能列表/描述/颜色/图标 | `src/data/skills.ts` |
| 各章节键盘的缩放/位置/旋转（镜头语言） | `src/components/keyboard-states.ts` 的 `STATES` |
| 入场动画、contact 键帽漂浮参数 | `src/components/keyboard-canvas.tsx` |
| 按键音效（合成器参数） | `src/hooks/use-keycap-sound.ts` |
| 场景文件路径 | `src/data/config.ts` 的 `sceneUrl` |

调试技巧：浏览器控制台里可以验证对象名是否对得上——
DevTools → Sources 断点在 `keyboard-canvas.tsx`，或临时
`console.log(app.findObjectByName("react"))`（undefined = 场景里没这个名字的对象，
多半是打错了或没放进 `keyboard` 组）。

---

## 8. 进阶玩法（原站有、本脚手架预留扩展位）

- **键盘背面彩蛋**：原站在 projects 章节把键盘翻到背面，藏了一只逐帧动画的
  bongo cat。你可以在背面放任何东西（贴纸、logo、小手办），翻转已由
  `STATES.projects` 的 rotation 实现，无需代码改动。
- **场景内 3D 文字**：创建 `heading`/`desc` 两个 text 变量并在场景中放绑定的
  文字对象，代码会自动同步（已有 `trySetVariable` 兜底，不建则用 HTML 浮层）。
  注意 3D 字体大多不含中文字形，文字内容建议用英文。
- **明暗两套键帽**：原站为亮/暗主题各做了一组键帽文字对象按需显隐。
  本脚手架用 HTML 浮层替代，已经天然适配双主题，一般无需做这个。
