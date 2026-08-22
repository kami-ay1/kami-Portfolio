/* eslint-disable @next/next/no-img-element */

import { useEffect, useState } from "react";
import { avatarUrl } from "@/data/avatars";

/**
 * 聊天头像：有头像文件（avatar-*.svg）时显示图片（底色 = 用户选的主题色）；
 * 加载失败或没有头像字段（旧消息）时，回退成首字母圆点。
 * 注意不能把字母垫在图片下面：头像是透明底 SVG，字母会透出来。
 */
export function ChatAvatar({
  name,
  color,
  avatar,
  className = "size-8",
}: {
  name: string;
  color: string;
  avatar?: string;
  className?: string;
}) {
  const url = avatarUrl(avatar);
  const [failed, setFailed] = useState(false);
  // 头像换了之后重置失败状态（新图重试）
  useEffect(() => setFailed(false), [url]);

  if (url && !failed) {
    return (
      <span
        className={`relative shrink-0 overflow-hidden rounded-full ${className}`}
        style={{ backgroundColor: color }}
      >
        <img
          src={url}
          alt={name}
          loading="lazy"
          onError={() => setFailed(true)}
          className="absolute inset-0 h-full w-full object-cover"
        />
      </span>
    );
  }
  return (
    <span
      className={`grid shrink-0 place-items-center rounded-full text-xs font-bold text-white ${className}`}
      style={{ backgroundColor: color }}
    >
      {name[0]?.toUpperCase()}
    </span>
  );
}
