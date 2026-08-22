// 本地生成一批「彩铅风格」动物头像（20 只动物 × 5 种彩铅配色 = 100 张，SVG）。
//
// 彩铅质感由 SVG 滤镜实现（纯本地、无依赖）：
//   1. feMorphology 外扩 + feFlood —— 给所有形状加彩铅笔深棕描边
//   2. feTurbulence + feDisplacementMap —— 手绘抖动（每张 seed 不同）
//   3. feColorMatrix hueRotate/saturate —— 五种配色（classic/warm/cool/pastel/dusk）
//   4. 叠几笔斜向排线，模拟彩铅铺色笔触
// 底图透明：聊天里用户选的主题色会衬在头像后面，像有色卡纸上画的。
//
// 用法：node scripts/generate-pencil-avatars.mjs
// 输出：public/assets/avatars/avatar-<动物>-<配色>.svg（共 100 张）
// 调长相：改 ANIMALS 里对应动物的绘制函数；调画风：改 PENCIL 滤镜参数；重跑即可。

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

// ---------- 通用部件（与原扁平版共用几何） ----------

const face = (fill) => `<circle cx="100" cy="106" r="56" fill="${fill}"/>`;

const beadEye = (x, y, r = 5.5, pupil = "#23252d") =>
  `<circle cx="${x}" cy="${y}" r="${r}" fill="${pupil}"/>` +
  `<circle cx="${x + 2}" cy="${y - 2}" r="${r * 0.34}" fill="#fff"/>`;

const eyes = (y = 98, dx = 21) => beadEye(100 - dx, y) + beadEye(100 + dx, y);

const blush = (y = 120) =>
  `<g opacity="0.4"><circle cx="66" cy="${y}" r="8" fill="#f9a8d4"/>` +
  `<circle cx="134" cy="${y}" r="8" fill="#f9a8d4"/></g>`;

const tri = (points, fill, w = 4) =>
  `<path d="M ${points.map((p) => p.join(" ")).join(" L ")} Z" fill="${fill}" stroke="${fill}" stroke-width="${w}" stroke-linejoin="round"/>`;

const noseOval = (y = 118, fill = "#33302e", rx = 8, ry = 6) =>
  `<ellipse cx="100" cy="${y}" rx="${rx}" ry="${ry}" fill="${fill}"/>`;

const smile = (y = 127, w = 15, stroke = "#33302e") =>
  `<path d="M ${100 - w} ${y} q ${w} 9 ${2 * w} 0" fill="none" stroke="${stroke}" stroke-width="3.5" stroke-linecap="round"/>`;

const whiskers = (stroke = "#a8a29e") =>
  `<g stroke="${stroke}" stroke-width="2.5" stroke-linecap="round" fill="none">` +
  `<path d="M60 118 q -15 -4 -25 -10"/><path d="M60 125 q -15 1 -26 4"/>` +
  `<path d="M140 118 q 15 -4 25 -10"/><path d="M140 125 q 15 1 26 4"/></g>`;

const earRound = (cx, cy, r, fill, inner = null, innerR = r * 0.55) =>
  `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}"/>` +
  (inner ? `<circle cx="${cx}" cy="${cy}" r="${innerR}" fill="${inner}"/>` : "");

const earPoint = (fill, inner = null) => {
  const left =
    `<path d="M46 82 L60 22 L94 50 Z" fill="${fill}" stroke="${fill}" stroke-width="12" stroke-linejoin="round"/>` +
    (inner
      ? `<path d="M56 70 L63 38 L82 52 Z" fill="${inner}" stroke="${inner}" stroke-width="6" stroke-linejoin="round"/>`
      : "");
  return left + `<g transform="translate(200 0) scale(-1 1)">${left}</g>`;
};

// ---------- 20 只动物（几何同卡通版） ----------

const ANIMALS = {
  falcon: () =>
    face("#57534e") +
    `<path d="M62 108 q38 -14 76 0 l0 20 q-38 14 -76 0 z" fill="#e7e5e4"/>` +
    `<path d="M74 94 q26 -8 52 0" stroke="#33302e" stroke-width="5" stroke-linecap="round" fill="none"/>` +
    eyes(104) +
    `<path d="M91 112 h18 q0 14 -7 22 q-4 -3 -7 -9 q-3 6 -6 4 q-2 -7 2 -17 z" fill="#eab308" stroke="#ca8a04" stroke-width="2" stroke-linejoin="round"/>` +
    `<path d="M74 108 q -2 14 3 20 l7 -3 q -4 -8 -3 -15 z" fill="#33302e"/>` +
    `<path d="M126 108 q 2 14 -3 20 l-7 -3 q 4 -8 3 -15 z" fill="#33302e"/>`,

  otter: () =>
    earRound(56, 60, 14, "#8a5a44") +
    earRound(144, 60, 14, "#8a5a44") +
    face("#8a5a44") +
    `<ellipse cx="100" cy="126" rx="30" ry="22" fill="#dbb68f"/>` +
    eyes(100) +
    noseOval(118, "#3f2a1d", 8, 6) +
    smile(130, 12, "#3f2a1d") +
    whiskers("#6b4633") +
    blush(114),

  panda: () =>
    earRound(54, 58, 16, "#292524") +
    earRound(146, 58, 16, "#292524") +
    face("#f5f0e8") +
    `<ellipse cx="79" cy="102" rx="12" ry="16" transform="rotate(-18 79 102)" fill="#292524"/>` +
    `<ellipse cx="121" cy="102" rx="12" ry="16" transform="rotate(18 121 102)" fill="#292524"/>` +
    beadEye(79, 102, 4.5, "#fff") +
    beadEye(121, 102, 4.5, "#fff") +
    noseOval(122, "#292524", 8, 6) +
    smile(131, 12, "#292524") +
    blush(126),

  tiger: () =>
    earPoint("#d97706", "#fde68a") +
    face("#f59e42") +
    `<g stroke="#33302e" stroke-width="5" stroke-linecap="round"><path d="M100 54 v14"/><path d="M88 58 l4 12"/><path d="M112 58 l-4 12"/></g>` +
    `<g stroke="#33302e" stroke-width="4.5" stroke-linecap="round"><path d="M48 104 h14"/><path d="M50 116 h12"/><path d="M152 104 h-14"/><path d="M150 116 h-12"/></g>` +
    `<ellipse cx="100" cy="124" rx="26" ry="18" fill="#fdf0dd"/>` +
    eyes(98) +
    tri([[94, 117], [106, 117], [100, 125]], "#d65a6b", 3) +
    smile(130, 11, "#7c4a2d") +
    whiskers("#c2793b"),

  koala: () =>
    earRound(46, 62, 23, "#a8a29e", "#f2c4c4", 13) +
    earRound(154, 62, 23, "#a8a29e", "#f2c4c4", 13) +
    face("#b9b3ae") +
    eyes(94) +
    `<ellipse cx="100" cy="120" rx="11" ry="16" fill="#33302e"/>` +
    smile(142, 11, "#33302e") +
    blush(110),

  lynx: () =>
    `<path d="M42 30 l10 -18 l6 16 z" fill="#33302e"/><path d="M158 30 l-10 -18 l-6 16 z" fill="#33302e"/>` +
    earPoint("#c8ab7b", "#8d6b3f") +
    face("#d6bd93") +
    `<path d="M50 96 q -12 14 -6 30 l14 -8 z" fill="#e9d9b8"/><path d="M150 96 q 12 14 6 30 l-14 -8 z" fill="#e9d9b8"/>` +
    `<g fill="#a98a58" opacity="0.7"><circle cx="70" cy="88" r="3"/><circle cx="132" cy="92" r="3"/><circle cx="76" cy="150" r="3"/><circle cx="126" cy="148" r="3"/></g>` +
    eyes(100) +
    tri([[94, 118], [106, 118], [100, 126]], "#a56a5c", 3) +
    smile(131, 10, "#7c5a3f") +
    whiskers("#b39a6d"),

  heron: () =>
    face("#7d94ab") +
    `<g stroke="#5c718a" stroke-width="6" stroke-linecap="round" fill="none"><path d="M104 52 q 22 -8 34 4"/><path d="M102 46 q 18 -16 34 -12"/></g>` +
    `<path d="M70 92 q30 -10 60 0" stroke="#4c6076" stroke-width="5" stroke-linecap="round" fill="none"/>` +
    beadEye(78, 102, 6, "#f6c445") +
    beadEye(122, 102, 6, "#f6c445") +
    `<path d="M96 112 L172 120 L96 128 z" fill="#475569" stroke="#334155" stroke-width="2" stroke-linejoin="round"/>` +
    smile(136, 10, "#4c6076"),

  dolphin: () =>
    face("#7b93a8") +
    `<path d="M76 72 q 24 -16 48 0" stroke="#9db4c6" stroke-width="7" stroke-linecap="round" fill="none"/>` +
    eyes(100) +
    `<path d="M74 128 q 26 16 52 0 q -6 16 -26 16 q -20 0 -26 -16 z" fill="#b9cbd8"/>` +
    `<path d="M72 124 q 28 22 56 0" fill="none" stroke="#54728a" stroke-width="4" stroke-linecap="round"/>`,

  rabbit: () =>
    `<g transform="rotate(-8 78 44)"><rect x="66" y="4" width="24" height="74" rx="12" fill="#e7e5e4"/><rect x="72" y="12" width="12" height="56" rx="6" fill="#f6b8c8"/></g>` +
    `<g transform="rotate(8 122 44)"><rect x="110" y="4" width="24" height="74" rx="12" fill="#e7e5e4"/><rect x="116" y="12" width="12" height="56" rx="6" fill="#f6b8c8"/></g>` +
    face("#e7e5e4") +
    eyes(98) +
    tri([[94, 116], [106, 116], [100, 124]], "#e8889e", 3) +
    smile(129, 10, "#8b8781") +
    `<rect x="94" y="131" width="12" height="10" rx="2" fill="#fff" stroke="#c9c5be" stroke-width="2"/>` +
    whiskers("#c9c5be") +
    blush(),

  fox: () =>
    earPoint("#ea8c3f", "#fde8d0") +
    face("#f0923f") +
    `<path d="M52 108 q 20 -8 48 0 q 28 -8 48 0 q 4 30 -48 42 q -52 -12 -48 -42 z" fill="#fbf3e4"/>` +
    eyes(100) +
    noseOval(122, "#33302e", 9, 7) +
    smile(133, 11, "#33302e") +
    blush(112),

  wolf: () =>
    earPoint("#6b7280", "#4b5563") +
    face("#9aa3af") +
    `<path d="M56 110 q 44 -12 88 0 q -2 34 -44 40 q -42 -6 -44 -40 z" fill="#e2e6ea"/>` +
    `<path d="M68 88 l22 6" stroke="#5b6470" stroke-width="5" stroke-linecap="round"/><path d="M132 88 l-22 6" stroke="#5b6470" stroke-width="5" stroke-linecap="round"/>` +
    eyes(100) +
    noseOval(124, "#33302e", 9, 7) +
    smile(134, 10, "#33302e"),

  bear: () =>
    earRound(56, 58, 16, "#9a6b3f", "#7a5330") +
    earRound(144, 58, 16, "#9a6b3f", "#7a5330") +
    face("#a8794a") +
    `<ellipse cx="100" cy="126" rx="27" ry="20" fill="#e0c097"/>` +
    eyes(98) +
    noseOval(120, "#33302e", 9, 7) +
    smile(132, 11, "#33302e") +
    blush(),

  hawk: () =>
    face("#b4622d") +
    `<path d="M66 90 q 34 -12 68 0" stroke="#f3e2c7" stroke-width="7" stroke-linecap="round" fill="none"/>` +
    eyes(104) +
    `<path d="M92 112 h16 q0 13 -6 20 q-4 -3 -6 -8 q-3 5 -5 3 q-2 -6 1 -15 z" fill="#9aa3af" stroke="#6b7280" stroke-width="2" stroke-linejoin="round"/>` +
    `<path d="M56 100 q -6 20 6 30 l6 -12 z" fill="#7c421c"/><path d="M144 100 q 6 20 -6 30 l-6 -12 z" fill="#7c421c"/>` +
    smile(138, 10, "#7c421c"),

  crane: () =>
    face("#f7f4ed") +
    `<circle cx="100" cy="58" r="9" fill="#e04545"/>` +
    eyes(100) +
    `<path d="M98 110 L170 119 L98 127 z" fill="#f0923f" stroke="#d97706" stroke-width="2" stroke-linejoin="round"/>` +
    smile(134, 9, "#b8ab98") +
    `<path d="M50 106 q -8 16 2 28 l10 -14 z" fill="#d9d2c2"/><path d="M150 106 q 8 16 -2 28 l-10 -14 z" fill="#d9d2c2"/>`,

  koi: () =>
    `<path d="M48 100 q -20 8 -24 26 q 16 -6 28 -2 z" fill="#f0923f"/><path d="M152 100 q 20 8 24 26 q -16 -6 -28 -2 z" fill="#f0923f"/>` +
    face("#f6a04d") +
    `<ellipse cx="100" cy="66" rx="22" ry="14" fill="#fdf6ec"/>` +
    `<g stroke="#d97706" stroke-width="3" fill="none" opacity="0.8"><path d="M64 96 q 6 8 12 0"/><path d="M124 96 q 6 8 12 0"/><path d="M70 150 q 6 8 12 0"/><path d="M118 150 q 6 8 12 0"/></g>` +
    eyes(102) +
    `<circle cx="100" cy="130" r="6" fill="#c2581f"/><circle cx="98" cy="128" r="1.8" fill="#7c3a12"/><circle cx="103" cy="128" r="1.8" fill="#7c3a12"/>`,

  moose: () =>
    `<g fill="#d9c7a1"><g><ellipse cx="34" cy="36" rx="13" ry="19" transform="rotate(-18 34 36)"/><ellipse cx="52" cy="22" rx="10" ry="13"/><ellipse cx="27" cy="55" rx="9" ry="11"/><path d="M52 40 q -8 14 -22 16 l 6 8 q 20 -4 26 -18 z"/></g><g transform="translate(200 0) scale(-1 1)"><ellipse cx="34" cy="36" rx="13" ry="19" transform="rotate(-18 34 36)"/><ellipse cx="52" cy="22" rx="10" ry="13"/><ellipse cx="27" cy="55" rx="9" ry="11"/><path d="M52 40 q -8 14 -22 16 l 6 8 q 20 -4 26 -18 z"/></g></g>` +
    earRound(58, 62, 13, "#7c5a3f") +
    earRound(142, 62, 13, "#7c5a3f") +
    face("#8a6a4b") +
    eyes(100) +
    `<ellipse cx="100" cy="132" rx="26" ry="18" fill="#54402e"/>` +
    `<circle cx="89" cy="132" r="4" fill="#33291e"/><circle cx="111" cy="132" r="4" fill="#33291e"/>` +
    smile(150, 10, "#54402e"),

  seal: () =>
    face("#c6cfda") +
    `<ellipse cx="50" cy="82" rx="7" ry="11" transform="rotate(-20 50 82)" fill="#aeb9c7"/><ellipse cx="150" cy="82" rx="7" ry="11" transform="rotate(20 150 82)" fill="#aeb9c7"/>` +
    beadEye(80, 100, 8) +
    beadEye(120, 100, 8) +
    noseOval(122, "#33302e", 9, 7) +
    smile(133, 12, "#33302e") +
    `<path d="M96 128 q 4 5 8 0" fill="none" stroke="#33302e" stroke-width="3" stroke-linecap="round"/>` +
    whiskers("#98a5b4") +
    blush(),

  crow: () =>
    face("#2b2926") +
    `<path d="M56 116 q 44 20 88 0 q -6 30 -44 34 q -38 -4 -44 -34 z" fill="#4a463f"/>` +
    beadEye(80, 100, 6, "#f5f0e8") +
    beadEye(120, 100, 6, "#f5f0e8") +
    `<path d="M90 114 h22 l -4 9 q -7 4 -14 0 z" fill="#585349" stroke="#403c34" stroke-width="2" stroke-linejoin="round"/>` +
    `<circle cx="96" cy="117" r="1.6" fill="#2b2926"/><circle cx="106" cy="117" r="1.6" fill="#2b2926"/>`,

  gecko: () =>
    face("#4ec77e") +
    [78, 122]
      .map(
        (x) =>
          `<circle cx="${x}" cy="98" r="14" fill="#f6c445"/><ellipse cx="${x}" cy="98" rx="4" ry="10" fill="#23252d"/>`,
      )
      .join("") +
    `<path d="M76 124 q 24 18 48 0" fill="none" stroke="#1f7a4d" stroke-width="4" stroke-linecap="round"/>` +
    `<g fill="#35a761" opacity="0.85"><circle cx="72" cy="76" r="3.5"/><circle cx="128" cy="78" r="3.5"/><circle cx="100" cy="66" r="4"/></g>` +
    `<path d="M66 88 q 12 -6 24 -2" stroke="#1f7a4d" stroke-width="4" stroke-linecap="round" fill="none"/><path d="M110 86 q 12 -4 24 2" stroke="#1f7a4d" stroke-width="4" stroke-linecap="round" fill="none"/>`,

  ibex: () =>
    `<path d="M58 58 C 36 44 26 22 40 12 C 44 26 52 38 68 46 Z" fill="#5d574f"/>` +
    `<path d="M142 58 C 164 44 174 22 160 12 C 156 26 148 38 132 46 Z" fill="#5d574f"/>` +
    earPoint("#a98a58", "#7c5a3f") +
    face("#c8ab7b") +
    eyes(102) +
    noseOval(124, "#33302e", 8, 6) +
    smile(135, 10, "#7c5a3f") +
    `<path d="M96 148 q 4 8 8 0" fill="none" stroke="#7c5a3f" stroke-width="4" stroke-linecap="round"/>` +
    whiskers("#b39a6d"),
};

// ---------- 彩铅化 ----------

/** 五种彩铅配色（色相旋转 + 饱和度） */
const PALETTES = {
  classic: { hue: 0, sat: 0.8, ink: "#6b5b4a" },   // 原色调降饱和 = 经典彩铅
  warm: { hue: 18, sat: 1.0, ink: "#7a4a3a" },     // 暖调
  cool: { hue: -32, sat: 0.9, ink: "#4a5568" },    // 冷调
  pastel: { hue: 8, sat: 0.5, ink: "#8a7a6b" },    // 粉彩
  dusk: { hue: 150, sat: 0.75, ink: "#4a3f5b" },   // 暮色
};

/** 彩铅排线（斜向短笔触，模拟铺色） */
const hatches = () =>
  `<g stroke="#6b5b4a" stroke-width="2" opacity="0.45" stroke-linecap="round">` +
  `<path d="M50 92 l10 -10"/><path d="M54 102 l12 -12"/><path d="M58 112 l10 -10"/>` +
  `<path d="M140 140 l10 -10"/><path d="M136 150 l12 -12"/></g>`;

/** 彩铅滤镜：描边 → 手绘抖动 → 配色 */
const pencilFilter = (seed, { hue, sat, ink }) => `
<filter id="cp" x="-15%" y="-15%" width="130%" height="130%" color-interpolation-filters="sRGB">
  <feMorphology in="SourceGraphic" operator="dilate" radius="1.4" result="dil"/>
  <feFlood flood-color="${ink}" flood-opacity="0.85" result="inkc"/>
  <feComposite in="inkc" in2="dil" operator="in" result="rim"/>
  <feComposite in="SourceGraphic" in2="rim" operator="over" result="art"/>
  <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="2" seed="${seed}" result="wob"/>
  <feDisplacementMap in="art" in2="wob" scale="4" xChannelSelector="R" yChannelSelector="G" result="warped"/>
  <feColorMatrix in="warped" type="hueRotate" values="${hue}"/>
  <feColorMatrix type="saturate" values="${sat}"/>
</filter>`;

// ---------- 输出 ----------

const outDir = path.join(process.cwd(), "public", "assets", "avatars");
await mkdir(outDir, { recursive: true });

let seed = 1;
let count = 0;
for (const [animal, draw] of Object.entries(ANIMALS)) {
  for (const [palette, cfg] of Object.entries(PALETTES)) {
    const svg =
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" fill="none">` +
      `<defs>${pencilFilter(seed++, cfg)}</defs>` +
      `<g filter="url(#cp)">${draw()}${hatches()}</g>` +
      `</svg>`;
    await writeFile(
      path.join(outDir, `avatar-${animal}-${palette}.svg`),
      svg,
    );
    count++;
  }
}
console.log(`✓ 已生成 ${count} 张彩铅动物头像 → ${outDir}`);
console.log(`  动物：${Object.keys(ANIMALS).join(", ")}`);
console.log(`  配色：${Object.keys(PALETTES).join(", ")}`);
