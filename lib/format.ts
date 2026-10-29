const BYTE_UNITS = ["B", "KB", "MB", "GB", "TB", "PB"] as const;

/** Human-readable byte size (base 1024, up to 2 decimals). */
export function formatBytes(bytes: number | null | undefined): string {
  const value = bytes ?? 0;
  if (value <= 0) return "0 B";

  const exponent = Math.min(
    Math.floor(Math.log(value) / Math.log(1024)),
    BYTE_UNITS.length - 1,
  );
  const scaled = value / 1024 ** exponent;
  const rounded = scaled >= 100 ? Math.round(scaled) : Math.round(scaled * 100) / 100;

  return `${rounded} ${BYTE_UNITS[exponent]}`;
}

/** Compact counts: 1234 → "1.2K", 1200000 → "1.2M". */
export function formatCompactNumber(value: number | null | undefined): string {
  const count = value ?? 0;
  return new Intl.NumberFormat("en", {
    notation: count >= 10_000 ? "compact" : "standard",
    maximumFractionDigits: 1,
  }).format(count);
}

export function formatNumber(value: number | null | undefined): string {
  return new Intl.NumberFormat("en").format(value ?? 0);
}

const RELATIVE_UNITS: Array<{ limit: number; unit: Intl.RelativeTimeFormatUnit; ms: number }> = [
  { limit: 60_000, unit: "second", ms: 1000 },
  { limit: 3_600_000, unit: "minute", ms: 60_000 },
  { limit: 86_400_000, unit: "hour", ms: 3_600_000 },
  { limit: 2_592_000_000, unit: "day", ms: 86_400_000 },
  { limit: 31_536_000_000, unit: "month", ms: 2_592_000_000 },
  { limit: Number.POSITIVE_INFINITY, unit: "year", ms: 31_536_000_000 },
];

const relativeFormatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

/** "3 minutes ago", "in 2 days" — for last-seen style timestamps. */
export function formatRelativeTime(date: Date | string | null | undefined): string {
  if (!date) return "never";

  const timestamp = typeof date === "string" ? new Date(date).getTime() : date.getTime();
  if (Number.isNaN(timestamp)) return "never";

  const diff = timestamp - Date.now();
  const abs = Math.abs(diff);

  if (abs < 10_000) return "just now";

  for (const { limit, unit, ms } of RELATIVE_UNITS) {
    if (abs < limit) {
      return relativeFormatter.format(Math.round(diff / ms), unit);
    }
  }

  return "just now";
}

const dateTimeFormatter = new Intl.DateTimeFormat("en", {
  dateStyle: "medium",
  timeStyle: "short",
});

export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const value = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(value.getTime())) return "—";
  return dateTimeFormatter.format(value);
}

/** Later — simple percentage helper used by usage meters. */
export function usagePercent(used: number, limit: number): number {
  if (!Number.isFinite(limit) || limit <= 0) return 0;
  return Math.min(100, Math.max(0, Math.round((used / limit) * 100)));
}
