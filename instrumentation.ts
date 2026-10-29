/**
 * Next.js instrumentation hook: runs once when the server process starts,
 * before any request is handled. Installing the console capture here means
 * the log buffer works for every route without import-order side effects.
 */
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { installLogHook } = await import("@/lib/runtime-logs");
    installLogHook();
  }
}
