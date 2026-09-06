/**
 * 本地 DiceBear Lorelei Neutral 头像（public/assets/avatars/guest-N.svg）。
 * 存档值是稳定 seed（guest-N），图由本地脚本生成——同 seed 与在线 API
 * 出的图完全一致（换回本地后每个人的脸不变），且不依赖外网、国内秒开。
 * backgroundColor=[] 透明底：用户选的主题色衬在头像后面（原项目同款）。
 * 重新生成：node scripts/generate-avatars.mjs lorelei-neutral 100
 * （注意脚本用纯数字 seed，这里用 guest-N 前缀保持与历史 seed 一致）。
 */
export const AVATARS = Array.from(
  { length: 100 },
  (_, index) => `guest-${index + 1}`,
);

export const avatarLabel = (seed: string) =>
  `Lorelei #${seed.replace("guest-", "")}`;

export const avatarUrl = (seed?: string) =>
  seed ? `/assets/avatars/${seed}.svg` : null;

/** Non-local values from earlier versions are intentionally invalid. */
export const isKnownAvatar = (seed: string) => AVATARS.includes(seed);

export const randomAvatar = () =>
  AVATARS[Math.floor(Math.random() * AVATARS.length)];
