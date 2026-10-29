import { z } from "zod";

export const BANNER_VARIANT_KEYS = [
  "info",
  "warning",
  "error",
  "success",
  "announcement",
  "marketing",
  "rainbow",
  "midnight",
] as const;

export type BannerVariant = (typeof BANNER_VARIANT_KEYS)[number];

export const BANNER_VARIANTS: Record<
  BannerVariant,
  { label: string; classes: string }
> = {
  info: {
    label: "Info (Blue)",
    classes: "bg-info/8 text-info-foreground border-info/20 dark:bg-info/16",
  },
  warning: {
    label: "Warning (Yellow)",
    classes: "bg-warning/8 text-warning-foreground border-warning/20 dark:bg-warning/16",
  },
  error: {
    label: "Error (Red)",
    classes:
      "bg-destructive/8 text-destructive-foreground border-destructive/20 dark:bg-destructive/16",
  },
  success: {
    label: "Success (Green)",
    classes:
      "bg-success/8 text-success-foreground border-success/20 dark:bg-success/16",
  },
  announcement: {
    label: "Announcement (Purple)",
    classes:
      "bg-violet-500/10 text-violet-700 border-violet-500/20 dark:text-violet-300",
  },
  marketing: {
    label: "Marketing (Gradient)",
    classes:
      "border-border text-foreground bg-gradient-to-r from-primary/15 via-info/15 to-success/15",
  },
  rainbow: {
    label: "Rainbow",
    classes:
      "border-border text-foreground bg-[linear-gradient(90deg,rgba(239,68,68,.14),rgba(249,115,22,.14),rgba(234,179,8,.14),rgba(34,197,94,.14),rgba(59,130,246,.14),rgba(168,85,247,.14))]",
  },
  midnight: {
    label: "Midnight",
    classes: "border-neutral-800 bg-neutral-950 text-neutral-100",
  },
};

export function bannerVariantOrDefault(value: unknown): BannerVariant {
  return (BANNER_VARIANT_KEYS as readonly string[]).includes(value as string)
    ? (value as BannerVariant)
    : "info";
}
