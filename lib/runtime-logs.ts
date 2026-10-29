import { randomUUID } from "node:crypto";

/**
 * In-process runtime log capture.
 *
 * Keeps a bounded ring buffer of recent console output so the admin console
 * can show what the server is doing. Deliberately per-process and in-memory:
 * after a restart the buffer is empty again, and with multiple instances each
 * one reports its own tail. The old implementation installed this hook as a
 * side effect of importing the database layer; here it is installed once from
 * `instrumentation.ts`.
 */

export type LogLevel = "info" | "warn" | "error";

export type LogEntry = {
  id: string;
  timestamp: string;
  level: LogLevel;
  message: string;
};

const MAX_LOGS = 1000;
const MAX_MESSAGE_LENGTH = 4000;

type LogGlobal = typeof globalThis & {
  __netgoatRuntimeLogs?: LogEntry[];
  __netgoatLogHookInstalled?: boolean;
};

const globalForLogs = globalThis as LogGlobal;

const store: LogEntry[] = (globalForLogs.__netgoatRuntimeLogs ??= []);

function stringifyArg(value: unknown): string {
  if (typeof value === "string") return value;
  if (value instanceof Error) return value.stack ?? value.message;
  if (typeof value === "object" && value !== null) {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
  return String(value);
}

export function addLog(level: LogLevel, args: unknown[]): void {
  const message = args
    .map(stringifyArg)
    .join(" ")
    .slice(0, MAX_MESSAGE_LENGTH);

  store.unshift({
    id: randomUUID(),
    timestamp: new Date().toISOString(),
    level,
    message,
  });

  if (store.length > MAX_LOGS) store.length = MAX_LOGS;
}

export function getRuntimeLogs(limit = 200): LogEntry[] {
  return store.slice(0, Math.min(MAX_LOGS, Math.max(1, Math.floor(limit))));
}

export function clearRuntimeLogs(): void {
  store.length = 0;
}

/**
 * Mirrors console.log/warn/error into the ring buffer while still calling the
 * originals, so terminal output and dev overlays keep working.
 */
export function installLogHook(): void {
  if (globalForLogs.__netgoatLogHookInstalled) return;
  globalForLogs.__netgoatLogHookInstalled = true;

  const target = console as unknown as Record<string, (...args: unknown[]) => void>;
  const patches: Array<[string, LogLevel]> = [
    ["log", "info"],
    ["warn", "warn"],
    ["error", "error"],
  ];

  for (const [method, level] of patches) {
    const original = target[method];
    if (typeof original !== "function") continue;

    target[method] = (...args: unknown[]) => {
      addLog(level, args);
      original.apply(console, args);
    };
  }

  addLog("info", ["Runtime log capture initialized."]);
}
