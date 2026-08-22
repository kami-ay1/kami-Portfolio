// 本地批量生成留言板头像（SVG，无需外网）。
//
// 用法：
//   node scripts/generate-avatars.mjs                 # 默认 lorelei 风格 × 24
//   node scripts/generate-avatars.mjs notionists 40   # 指定风格和数量
//   node scripts/generate-avatars.mjs adventurer 30   # 输出目录默认 public/assets/avatars
//
// 风格列表见 https://www.dicebear.com/styles/（如 lorelei、notionists、adventurer、
// big-smile、thumbs、pixel-art、identicon、bottts…），脚本会打印本机支持的全部风格。
// 生成后如数量变化，记得同步改 src/data/avatars.ts 里的 AVATARS 清单。

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { createAvatar } from "@dicebear/core";
import * as collection from "@dicebear/collection";

const styleArg = process.argv[2] ?? "lorelei";
// 包内的风格键是 camelCase（lorelei-neutral → loreleiNeutral），两种写法都认
const styleName = styleArg.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
const count = Math.min(Math.max(Number(process.argv[3]) || 24, 1), 100);
const outDir =
  process.argv[4] ?? path.join(process.cwd(), "public", "assets", "avatars");

const styles = Object.fromEntries(
  Object.entries(collection).filter(
    ([, v]) => typeof v === "object" && v && "schema" in v,
  ),
);
const style = styles[styleName];
if (!style) {
  console.error(
    `未知风格 "${styleArg}"。本机支持：\n  ${Object.keys(styles).join(", ")}`,
  );
  process.exit(1);
}

await mkdir(outDir, { recursive: true });
// seed 固定为序号：同一个 seed 每次生成结果一致，文件名 avatar-<序号>.svg
for (let i = 1; i <= count; i++) {
  const svg = createAvatar(style, {
    seed: String(i),
    backgroundColor: [], // 透明底，聊天里用用户选的颜色作背景
  }).toString();
  await writeFile(path.join(outDir, `avatar-${i}.svg`), svg);
}
console.log(`✓ 已生成 ${count} 个 ${styleName} 头像 → ${outDir}`);
console.log(`  （数量变了的话，同步更新 src/data/avatars.ts 的 AVATARS 清单）`);
