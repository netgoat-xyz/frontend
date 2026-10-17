import { z } from "zod";

import { AuthError } from "@/lib/auth-guards";

export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

/** Normalizes thrown errors into client-safe action results. */
export function toActionResult(error: unknown, fallback = "Something went wrong. Please try again."): ActionResult<never> {
  if (error instanceof AuthError) {
    return { ok: false, error: error.message };
  }

  if (error instanceof z.ZodError) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of error.issues) {
      const key = issue.path.join(".") || "form";
      fieldErrors[key] ??= issue.message;
    }
    const first = error.issues[0]?.message ?? fallback;
    return { ok: false, error: first, fieldErrors };
  }

  // Known business-rule failures are surfaced verbatim; everything else is
  // logged server-side and replaced with a generic message.
  if (error instanceof Error && error.name === "DomainError") {
    return { ok: false, error: error.message };
  }

  console.error("[action]", error);
  return { ok: false, error: fallback };
}

/** Business-rule error whose message is safe to show to users. */
export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DomainError";
  }
}
