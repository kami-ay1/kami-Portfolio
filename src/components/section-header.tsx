"use client";

import { cn } from "@/lib/utils";

/** 章节标题：编号 + 标题 + 副标题 */
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
      <h2 className="font-display text-4xl font-bold tracking-tight md:text-5xl">
        {title}
      </h2>
      {desc && (
        <p className="mt-3 text-lg text-muted-foreground">{desc}</p>
      )}
    </div>
  );
}
