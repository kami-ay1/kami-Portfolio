/**
 * Remote DiceBear Lorelei avatars. The stored value is a stable seed, not an
 * image filename, so the guestbook does not need to ship avatar assets.
 */
export const AVATARS = Array.from(
  { length: 100 },
  (_, index) => `guest-${index + 1}`,
);

export const avatarLabel = (seed: string) =>
  `Lorelei ${seed.replace("guest-", "#")}`;

export const avatarUrl = (seed?: string) =>
  seed
    ? `https://api.dicebear.com/9.x/lorelei/svg?seed=${encodeURIComponent(seed)}`
    : null;

/** Local avatar filenames from earlier versions are intentionally invalid. */
export const isKnownAvatar = (seed: string) => AVATARS.includes(seed);

export const randomAvatar = () =>
  AVATARS[Math.floor(Math.random() * AVATARS.length)];
