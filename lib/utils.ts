import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

type MaybeError = {
  message?: unknown;
  error?: { message?: unknown } | unknown;
};

/**
 * Extracts a human-readable message from the many error shapes produced by
 * fetch, better-auth and server actions. Falls back to `fallback` when no
 * message is present.
 */
export function getErrorMessage(error: unknown, fallback: string): string {
  if (typeof error === "string" && error.trim()) return error;

  if (error && typeof error === "object") {
    const candidate = error as MaybeError;

    if (typeof candidate.message === "string" && candidate.message.trim()) {
      return candidate.message;
    }

    const nested = candidate.error;
    if (
      nested &&
      typeof nested === "object" &&
      "message" in nested &&
      typeof (nested as { message?: unknown }).message === "string"
    ) {
      const message = (nested as { message: string }).message;
      if (message.trim()) return message;
    }
  }

  return fallback;
}
