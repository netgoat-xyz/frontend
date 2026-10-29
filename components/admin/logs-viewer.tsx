"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import {
  PauseIcon,
  PlayIcon,
  Delete02Icon,
} from "@hugeicons/core-free-icons";
import { useCallback, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toastManager } from "@/components/ui/toast";
import type { LogEntry } from "@/lib/runtime-logs";
import { cn } from "@/lib/utils";

const POLL_INTERVAL_MS = 2000;
const LEVEL_BADGES: Record<LogEntry["level"], { label: string; className: string }> = {
  info: { label: "INFO", className: "text-sky-400" },
  warn: { label: "WARN", className: "text-amber-400" },
  error: { label: "ERROR", className: "text-red-400" },
};
const ANSI_COLORS: Record<string, string> = {
  "30": "text-neutral-500",
  "31": "text-red-400",
  "32": "text-emerald-400",
  "33": "text-amber-400",
  "34": "text-blue-400",
  "35": "text-fuchsia-400",
  "36": "text-cyan-400",
  "37": "text-neutral-200",
  "90": "text-neutral-500",
  "91": "text-red-400",
  "92": "text-emerald-400",
  "93": "text-amber-400",
  "94": "text-blue-400",
  "95": "text-fuchsia-400",
  "96": "text-cyan-400",
  "97": "text-neutral-100",
};

type Segment = { text: string; className?: string };

/** Minimal ANSI SGR parser so coloured server output renders in the viewer. */
function parseAnsi(input: string): Segment[] {
  const segments: Segment[] = [];
  let color: string | undefined;
  let bold = false;
  let lastIndex = 0;

  const regex = /\u001b\[([0-9;]*)m/g;
  let match = regex.exec(input);

  const currentClass = () =>
    [color, bold ? "font-semibold" : undefined].filter(Boolean).join(" ") ||
    undefined;

  while (match) {
    const text = input.slice(lastIndex, match.index);
    if (text) segments.push({ text, className: currentClass() });

    for (const code of (match[1] ?? "").split(";").filter(Boolean)) {
      if (code === "0") {
        color = undefined;
        bold = false;
      } else if (code === "1") {
        bold = true;
      } else if (ANSI_COLORS[code]) {
        color = ANSI_COLORS[code];
      }
    }

    lastIndex = match.index + match[0].length;
    match = regex.exec(input);
  }

  const rest = input.slice(lastIndex);
  if (rest) segments.push({ text: rest, className: currentClass() });
  return segments;
}

const REQUEST_RE = /^\s*(GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS)\b/;

const METHOD_COLORS: Record<string, string> = {
  GET: "bg-sky-500/15 text-sky-300",
  POST: "bg-emerald-500/15 text-emerald-300",
  PUT: "bg-amber-500/15 text-amber-300",
  PATCH: "bg-fuchsia-500/15 text-fuchsia-300",
  DELETE: "bg-red-500/15 text-red-300",
  HEAD: "bg-neutral-500/15 text-neutral-300",
  OPTIONS: "bg-neutral-500/15 text-neutral-300",
};

function LogLine({ entry }: { entry: LogEntry }) {
  const methodMatch = REQUEST_RE.exec(entry.message);
  const method = methodMatch?.[1];
  const rest = method ? entry.message.replace(REQUEST_RE, "") : entry.message;
  const segments = parseAnsi(rest);

  return (
    <div className="flex items-start gap-2 border-b border-neutral-900 px-3 py-1.5 last:border-b-0">
      <span className="shrink-0 font-mono text-[11px] text-neutral-500">
        {new Date(entry.timestamp).toLocaleTimeString(undefined, {
          hour12: false,
        })}
      </span>
      <span
        className={cn(
          "shrink-0 font-mono text-[11px] font-semibold",
          LEVEL_BADGES[entry.level].className,
        )}
      >
        {LEVEL_BADGES[entry.level].label.padEnd(5)}
      </span>
      {method ? (
        <span
          className={cn(
            "shrink-0 rounded px-1.5 font-mono text-[11px] font-semibold",
            METHOD_COLORS[method] ?? METHOD_COLORS.HEAD,
          )}
        >
          {method}
        </span>
      ) : null}
      <span className="min-w-0 font-mono text-[11px] break-words whitespace-pre-wrap text-neutral-300">
        {segments.map((segment, index) => (
          <span key={index} className={segment.className}>
            {segment.text}
          </span>
        ))}
      </span>
    </div>
  );
}

/** Live server log viewer. Polls the admin log route; pause to freeze. */
export function LogsViewer() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [polling, setPolling] = useState(true);
  const [requestsOnly, setRequestsOnly] = useState(true);
  const [failed, setFailed] = useState(false);
  const inFlight = useRef(false);

  const load = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;

    try {
      const response = await fetch("/api/admin/logs?limit=300", {
        cache: "no-store",
      });
      if (!response.ok) throw new Error(`status ${response.status}`);

      const payload: unknown = await response.json();
      const nextLogs =
        typeof payload === "object" &&
        payload !== null &&
        Array.isArray((payload as { logs?: unknown }).logs)
          ? ((payload as { logs: LogEntry[] }).logs)
          : [];

      setLogs(nextLogs);
      setFailed(false);
    } catch {
      setFailed(true);
    } finally {
      inFlight.current = false;
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!polling) return;
    const timer = setInterval(() => void load(), POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [polling, load]);

  const visible = requestsOnly
    ? logs.filter((entry) => REQUEST_RE.test(entry.message))
    : logs;

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <span className="flex items-center gap-2 text-sm">
          <span
            className={cn(
              "size-2 rounded-full",
              polling && !failed ? "animate-pulse bg-emerald-500" : "bg-neutral-500",
            )}
          />
          {failed
            ? "Connection lost — retrying"
            : polling
              ? "Live · refreshing every 2s"
              : "Paused"}
        </span>

        <label className="flex items-center gap-2 text-sm">
          <Switch
            checked={requestsOnly}
            onCheckedChange={setRequestsOnly}
            aria-label="Show requests only"
          />
          Requests only
        </label>

        <div className="ms-auto flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPolling((current) => !current)}
          >
            <HugeiconsIcon icon={polling ? PauseIcon : PlayIcon} />
            {polling ? "Pause" : "Resume"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setLogs([]);
              toastManager.add({
                type: "info",
                title: "View cleared",
                description: "The server buffer is untouched; new entries keep arriving.",
              });
            }}
          >
            <HugeiconsIcon icon={Delete02Icon} />
            Clear view
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-neutral-900 bg-neutral-950">
        <div className="flex items-center justify-between border-b border-neutral-900 px-3 py-2">
          <span className="font-mono text-xs text-neutral-400">
            server stdout / stderr
          </span>
          <Badge variant="outline" className="font-mono text-[10px]">
            {visible.length} / {logs.length} lines
          </Badge>
        </div>

        <div className="h-[calc(100vh-300px)] min-h-80 overflow-auto">
          {visible.length === 0 ? (
            <p className="px-3 py-8 text-center font-mono text-xs text-neutral-500">
              {logs.length === 0
                ? "Waiting for server output…"
                : "No request lines in the current buffer — turn off “Requests only”."}
            </p>
          ) : (
            visible.map((entry) => <LogLine key={entry.id} entry={entry} />)
          )}
        </div>
      </div>

      <p className="text-muted-foreground mt-3 text-xs">
        Buffered per server process (last 1000 lines); the buffer starts empty
        after a restart.
      </p>
    </>
  );
}
