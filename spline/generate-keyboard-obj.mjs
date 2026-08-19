/**
 * 生成 Spline 可导入的键盘模型 OBJ 文件（无第三方依赖，纯文本几何）。
 *
 * 输出 spline/keyboard.obj：
 *   - o body        键盘外壳（扁盒子）
 *   - o js / ts / react ... 20 个键帽（上窄下宽的台体，真实键帽轮廓）
 *     名称与 src/data/skills.ts 的 SKILL_KEYS 完全一致 —— 导入 Spline 后
 *     无需逐个重命名，直接进入"绑事件"步骤。
 *
 * 用法：node spline/generate-keyboard-obj.mjs
 * 改技能列表/排布后重跑即可（SKILL_KEYS 与 skills.ts 保持同步）。
 */
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

// ── 与 src/data/skills.ts 的 SKILL_KEYS 保持一致 ──
const SKILL_KEYS = [
  "js", "ts", "html", "css", "react",
  "vue", "nextjs", "tailwind", "nodejs", "express",
  "postgres", "mongodb", "git", "github", "docker",
  "linux", "nginx", "aws", "vim", "vercel",
];

const COLS = 5; // 5×4 阵列

// ── 尺寸（场景单位，导入后整体缩放随意）──
const KEY_W = 100, KEY_D = 100;      // 键帽底面
const KEY_TOP = 82;                  // 键帽顶面（收窄，形成键帽斜肩）
const KEY_H = 40;                    // 键帽高度
const GAP = 20;                      // 键间距
const BODY_T = 30;                   // 外壳厚度
const BODY_MARGIN = 30;              // 键区到外壳边缘

const gridW = COLS * KEY_W + (COLS - 1) * GAP;
const rows = Math.ceil(SKILL_KEYS.length / COLS);
const gridD = rows * KEY_D + (rows - 1) * GAP;
const bodyW = gridW + BODY_MARGIN * 2;
const bodyD = gridD + BODY_MARGIN * 2;

let obj = "# 键盘模板 — 由 generate-keyboard-obj.mjs 生成，供 Spline 导入\n";
let vertexCount = 0;

/** 追加一个台体（上小下大的键帽形状），返回 OBJ 文本 */
function frustum(name, cx, y0, cz, x0, z0, x1, z1, h) {
  const b1 = [-x0 + cx, y0, -z0 + cz], b2 = [x0 + cx, y0, -z0 + cz];
  const b3 = [x0 + cx, y0, z0 + cz],  b4 = [-x0 + cx, y0, z0 + cz];
  const t1 = [-x1 + cx, y0 + h, -z1 + cz], t2 = [x1 + cx, y0 + h, -z1 + cz];
  const t3 = [x1 + cx, y0 + h, z1 + cz],   t4 = [-x1 + cx, y0 + h, z1 + cz];
  const verts = [b1, b2, b3, b4, t1, t2, t3, t4];

  // 每个面 2 个三角形，全部按"从外部看逆时针"（OBJ 惯例），法线朝外
  const faces = [
    [1, 2, 3], [1, 3, 4],        // 底面 -Y（埋在外壳里，仅保险）
    [5, 7, 6], [5, 8, 7],        // 顶面 +Y
    [1, 5, 6], [1, 6, 2],        // 前 -Z
    [4, 3, 7], [4, 7, 8],        // 后 +Z
    [1, 4, 8], [1, 8, 5],        // 左 -X
    [3, 2, 6], [3, 6, 7],        // 右 +X
  ];

  let out = `o ${name}\n`;
  for (const v of verts) out += `v ${v.map((n) => n.toFixed(2)).join(" ")}\n`;
  const base = vertexCount;
  for (const f of faces) out += `f ${f.map((i) => i + base).join(" ")}\n`;
  vertexCount += verts.length;
  return out;
}

// ── 外壳 ──
obj += frustum("body", 0, 0, 0, bodyW / 2, bodyD / 2, bodyW / 2, bodyD / 2, BODY_T);

// ── 键帽阵列（5 列 × 4 行，居中于原点）──
SKILL_KEYS.forEach((name, i) => {
  const col = i % COLS;
  const row = Math.floor(i / COLS);
  const cx = -gridW / 2 + KEY_W / 2 + col * (KEY_W + GAP);
  const cz = -gridD / 2 + KEY_D / 2 + row * (KEY_D + GAP);
  obj += frustum(name, cx, BODY_T, cz, KEY_W / 2, KEY_D / 2, KEY_TOP / 2, KEY_TOP / 2, KEY_H);
});

// ── 写文件 ──
const outPath = join(dirname(fileURLToPath(import.meta.url)), "keyboard.obj");
writeFileSync(outPath, obj);

// ── 自检：解析回读，校验索引范围与对象完整性 ──
const lines = obj.split("\n");
const vCount = lines.filter((l) => l.startsWith("v ")).length;
const objects = lines.filter((l) => l.startsWith("o ")).map((l) => l.slice(2));
let maxIdx = 0;
for (const l of lines) {
  if (!l.startsWith("f ")) continue;
  for (const part of l.slice(2).split(" ")) {
    const idx = parseInt(part, 10);
    if (!(idx >= 1 && idx <= vCount)) throw new Error(`非法面索引: ${part}`);
    maxIdx = Math.max(maxIdx, idx);
  }
}
const expected = ["body", ...SKILL_KEYS];
const ok =
  objects.length === expected.length &&
  expected.every((n) => objects.includes(n)) &&
  maxIdx <= vCount;
console.log(`对象 ${objects.length} 个（预期 ${expected.length}）：${ok ? "✓ 全部就位" : "✗ 缺失！"}`);
console.log(`顶点 ${vCount}，最大面索引 ${maxIdx} ≤ ${vCount}：${maxIdx <= vCount ? "✓" : "✗"}`);
console.log(`外壳 ${bodyW}×${bodyD}×${BODY_T}，键帽 ${KEY_W} 底 / ${KEY_TOP} 顶 / 高 ${KEY_H}`);
console.log(`已写入 ${outPath}`);
if (!ok) process.exit(1);
