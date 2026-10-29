import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";

import { cn } from "@/lib/utils";

type StatCardProps = {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  icon: IconSvgElement;
  className?: string;
};

/** Compact metric tile used across dashboard pages. */
export function StatCard({ label, value, hint, icon, className }: StatCardProps) {
  return (
    <div className={cn("bg-card rounded-xl border p-4", className)}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
          {label}
        </span>
        <HugeiconsIcon icon={icon} className="text-muted-foreground size-4" />
      </div>
      <p className="font-heading mt-2 text-2xl font-semibold tabular-nums">
        {value}
      </p>
      {hint ? (
        <p className="text-muted-foreground mt-0.5 text-xs">{hint}</p>
      ) : null}
    </div>
  );
}
