// 合成一段无缝循环的极简氛围垫音（BGM 占位，纯本地、无依赖）。
//
//   node scripts/generate-bgm.mjs
// 输出：public/assets/bgm.wav（12s 单声道 22050Hz 16-bit，约 0.5MB）
//
// 所有振荡器频率都取 12s 的整数周期（110Hz 的倍数），循环边界天然无缝；
// 想换真实音乐：把任意音频放到 public/assets/bgm.（mp3|wav），
// 改 src/data/config.ts 的 bgm.url 指向它即可。

import { writeFile } from "node:fs/promises";
import path from "node:path";

const SR = 22050;
const DUR = 12;
const N = SR * DUR;

// A 调五声堆叠（110 的整数倍 → 循环无缝），音量低到像背景垫
const NOTES = [
  { f: 110, gain: 0.1, lfo: 1 }, // A2
  { f: 165, gain: 0.07, lfo: 2 }, // E3
  { f: 220, gain: 0.06, lfo: 3 }, // A3
  { f: 330, gain: 0.035, lfo: 4 }, // E4
  { f: 440, gain: 0.02, lfo: 6 }, // A4
];

const samples = new Int16Array(N);
for (let i = 0; i < N; i++) {
  const t = i / SR;
  let v = 0;
  for (const { f, gain, lfo } of NOTES) {
    // 每个音一个整数周期的慢颤音（也是无缝的），加一点点两次谐波更"木头"
    const trem = 0.6 + 0.4 * Math.sin((2 * Math.PI * lfo * t) / DUR);
    v += gain * trem * Math.sin(2 * Math.PI * f * t);
    v += gain * 0.18 * trem * Math.sin(4 * Math.PI * f * t);
  }
  samples[i] = Math.round(Math.max(-1, Math.min(1, v)) * 32767 * 0.9);
}

// 16-bit PCM WAV 头（44 字节）+ 数据
const header = Buffer.alloc(44);
header.write("RIFF", 0);
header.writeUInt32LE(36 + N * 2, 4);
header.write("WAVE", 8);
header.write("fmt ", 12);
header.writeUInt32LE(16, 16);
header.writeUInt16LE(1, 20); // PCM
header.writeUInt16LE(1, 22); // mono
header.writeUInt32LE(SR, 24);
header.writeUInt32LE(SR * 2, 28);
header.writeUInt16LE(2, 32);
header.writeUInt16LE(16, 34);
header.write("data", 36);
header.writeUInt32LE(N * 2, 40);

const out = path.join(process.cwd(), "public", "assets", "bgm.wav");
await writeFile(out, Buffer.concat([header, Buffer.from(samples.buffer)]));
console.log(`✓ 已生成 ${DUR}s 无缝循环氛围垫音 → ${out}`);
