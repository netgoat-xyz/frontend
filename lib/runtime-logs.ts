export type LogEntry = {
  id: string;
  timestamp: string;
  level: "info" | "warn" | "error" | "debug";
  message: string;
};

type RuntimeLogGlobal = typeof globalThis & {
  __RUNTIME_LOGS__?: LogEntry[];
  __LOG_HOOK_INSTALLED__?: boolean;
};

const MAX_LOGS = 1000;
const runtimeGlobal = globalThis as RuntimeLogGlobal;
const globalLogStore = runtimeGlobal.__RUNTIME_LOGS__ || ([] as LogEntry[]);
if (!runtimeGlobal.__RUNTIME_LOGS__) {
  runtimeGlobal.__RUNTIME_LOGS__ = globalLogStore;
}

export function addLog(level: LogEntry["level"], ...args: unknown[]) {
  const message = args.map(arg => 
    typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
  ).join(' ');

  const entry: LogEntry = {
    id: Math.random().toString(36).substring(7),
    timestamp: new Date().toISOString(),
    level,
    message
  };

  globalLogStore.unshift(entry); // Add to beginning
  if (globalLogStore.length > MAX_LOGS) {
    globalLogStore.pop();
  }
}

let hooked = false;

export function installLogHook() {
  if (hooked) return;
  if (runtimeGlobal.__LOG_HOOK_INSTALLED__) return;

  runtimeGlobal.__LOG_HOOK_INSTALLED__ = true;
  hooked = true;

  const originalLog = console.log;
  const originalWarn = console.warn;
  const originalError = console.error;

  console.log = (...args) => {
    addLog('info', ...args);
    originalLog.apply(console, args);
  };

  console.warn = (...args) => {
    addLog('warn', ...args);
    originalWarn.apply(console, args);
  };

  console.error = (...args) => {
    addLog('error', ...args);
    originalError.apply(console, args);
  };

  addLog('info', 'Realtime log capture initialized.');
}

export function getRuntimeLogs(limit = 100) {
  return globalLogStore.slice(0, limit);
}
