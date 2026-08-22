"use client";

import { cn } from "@/lib/utils";

/** 章节标题：编号 + 标题 + 副标题。
 *  亮色模式给文字加浅色光晕（text halo）——内容层透明后，深色标题
 *  压在深色 3D 键盘上时靠光晕保可读；暗色模式关闭光晕。 */
export function SectionHeader({
  title,
  desc,
  className,
}: {
  title: string;
  desc?: string;
  className?: string;
}) {
  return (
    <div className={cn("mb-12", className)}>
      <h2 className="font-display text-4xl font-bold tracking-tight [text-shadow:0_1px_10px_rgba(255,255,255,0.85),0_0_3px_rgba(255,255,255,0.9)] dark:[text-shadow:none] md:text-5xl">
        {title}
      </h2>
      {desc && (
        <p className="mt-3 text-lg text-muted-foreground [text-shadow:0_1px_8px_rgba(255,255,255,0.9),0_0_3px_rgba(255,255,255,0.9)] dark:[text-shadow:none]">
          {desc}
        </p>
      )}
    </div>
  );
}
