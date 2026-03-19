"use client";

import { useEffect, useState } from "react";
import { Terminal, Pause, Play, Trash2, Filter } from "lucide-react";
import { getServerLogs } from "@/actions/adminValues";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface RuntimeLog {
  id: string;
  timestamp: string;
  level: "error" | "warn" | "info" | "debug";
  message: string;
}

function parseAnsiSegments(text: string): Array<{ text: string; className: string }> {
  const parts = text.split(/(\x1b\[[0-9;]*m)/g);
  const segments: Array<{ text: string; className: string }> = [];
  let currentClasses: string[] = [];

  for (const part of parts) {
    if (part.match(/^\x1b\[[0-9;]*m$/)) {
      const codes = part
        .replace(/\x1b\[/, "")
        .replace("m", "")
        .split(";")
        .map(Number);

      let nextClasses = currentClasses;
      for (const code of codes) {
        if (code === 0) {
          nextClasses = [];
        } else if (code === 1) {
          nextClasses = [...nextClasses, "font-bold"];
        } else if (code >= 30 && code <= 37) {
          const colors = [
            "text-black",
            "text-red-500",
            "text-green-500",
            "text-yellow-500",
            "text-blue-500",
            "text-purple-500",
            "text-cyan-500",
            "text-white",
          ];
          nextClasses = [
            ...nextClasses.filter((className) => !className.startsWith("text-")),
            colors[code - 30],
          ];
        } else if (code === 39) {
          nextClasses = nextClasses.filter((className) => !className.startsWith("text-"));
        }
      }

      currentClasses = nextClasses;
      continue;
    }

    if (!part) continue;
    segments.push({ text: part, className: currentClasses.join(" ") });
  }

  return segments;
}

function AnsiText({ text }: { text: string }) {
  if (!text) return null;
  const segments = parseAnsiSegments(text);

  return (
    <span>
      {segments.map((segment, i) => (
        <span key={i} className={segment.className}>
          {segment.text}
        </span>
      ))}
    </span>
  );
}

function MethodBadge({ method }: { method: string }) {
  const colors: Record<string, string> = {
    GET: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    POST: "bg-green-500/10 text-green-500 border-green-500/20",
    PUT: "bg-orange-500/10 text-orange-500 border-orange-500/20",
    DELETE: "bg-red-500/10 text-red-500 border-red-500/20",
    PATCH: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
    HEAD: "bg-purple-500/10 text-purple-500 border-purple-500/20",
    OPTIONS: "bg-gray-500/10 text-gray-500 border-gray-500/20",
  };
  return (
    <span
      className={`px-1.5 py-0.5 rounded-sm text-[10px] uppercase border font-medium ${colors[method.toUpperCase()] || "bg-neutral-500/10 text-neutral-400 border-neutral-500/20"}`}
    >
      {method}
    </span>
  );
}

function LogItem({ log }: { log: RuntimeLog }) {
  const methodMatch = log.message.trim().match(/^(GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS)/i);

  if (methodMatch) {
    const method = methodMatch[0];
    const rest = log.message.substring(method.length).trim();

    const statusMatch = rest.match(/\b([1-5][0-9]{2})\b/);
    const durationMatch = rest.match(/\b(\d+(\.\d+)?(ms|s))\b/);

    return (
      <div className="flex gap-2 items-start py-0.5 border-b border-white/5 last:border-0 hover:bg-white/5 px-2 -mx-2 transition-colors">
        <span className="text-neutral-500 shrink-0 text-xs w-20 pt-1">
          {new Date(log.timestamp).toLocaleTimeString([], {
            hour12: false,
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          })}
        </span>
        <div className="flex gap-2 items-center flex-wrap break-all">
          <MethodBadge method={method} />
          <span className="text-neutral-300">
            {rest.split(" ").map((word: string, i: number) => {
              if (statusMatch && word === statusMatch[0]) {
                const code = Number.parseInt(word, 10);
                let color = "text-neutral-400";
                if (code >= 200 && code < 300) color = "text-green-500";
                else if (code >= 300 && code < 400) color = "text-blue-500";
                else if (code >= 400 && code < 500) color = "text-yellow-500";
                else if (code >= 500) color = "text-red-500";
                return (
                  <span key={i} className={`font-bold ${color} mr-1`}>
                    {word}
                  </span>
                );
              }
              if (durationMatch && word === durationMatch[0]) {
                return (
                  <span key={i} className="text-neutral-500 mr-1 italic">
                    {word}
                  </span>
                );
              }
              if (word.startsWith("/")) {
                return (
                  <span key={i} className="text-cyan-400 mr-1">
                    {word}
                  </span>
                );
              }
              return (
                <span key={i} className="mr-1">
                  {word}
                </span>
              );
            })}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-2 items-start py-0.5 border-b border-white/5 last:border-0 hover:bg-white/5 px-2 -mx-2 transition-colors">
      <span className="text-neutral-500 shrink-0 text-xs w-20 pt-1">
        {new Date(log.timestamp).toLocaleTimeString([], {
          hour12: false,
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })}
      </span>
      <span
        className={`shrink-0 font-bold text-xs pt-0.5 ${
          log.level === "error"
            ? "text-red-500"
            : log.level === "warn"
              ? "text-yellow-500"
              : "text-blue-400"
        }`}
      >
        {log.level.toUpperCase()}
      </span>
      <span className="text-neutral-300 break-all">
        <AnsiText text={log.message} />
      </span>
    </div>
  );
}

export default function AdminLogsPage() {
  const t = useTranslations("DashboardPages.admin.logs");
  const [logs, setLogs] = useState<RuntimeLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [polling, setPolling] = useState(true);
  const [showRequestsOnly, setShowRequestsOnly] = useState(true);

  const fetchLogs = async () => {
    try {
      const data = (await getServerLogs()) as RuntimeLog[];
      setLogs(data);
    } catch (error) {
      console.error("Failed to fetch logs", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(() => {
      if (polling) fetchLogs();
    }, 2000);
    return () => clearInterval(interval);
  }, [polling]);

  const filteredLogs = showRequestsOnly
    ? logs.filter((log) => /^\s*(GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS)/i.test(log.message))
    : logs;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-muted-foreground mt-1 text-sm md:text-base">{t("subtitle")}</p>
        </div>
      </div>
      <Card className="h-[calc(100vh-250px)] flex flex-col shadow-sm border-border/50 hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="space-y-1">
            <CardTitle className="text-xl flex items-center gap-2">
              <Terminal className="h-5 w-5" /> {t("liveServerLogs")}
            </CardTitle>
            <CardDescription>{t("description")}</CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant={polling ? "default" : "secondary"}>
              {polling ? t("badges.live") : t("badges.paused")}
            </Badge>
            <Button
              variant={showRequestsOnly ? "default" : "outline"}
              size="sm"
              onClick={() => setShowRequestsOnly(!showRequestsOnly)}
              title={t("actions.toggleRequestFilter")}
            >
              <Filter className="h-4 w-4 mr-2" />
              {t("actions.requests")}
            </Button>
            <Button variant="outline" size="sm" onClick={() => setPolling(!polling)}>
              {polling ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
            <Button variant="outline" size="sm" onClick={() => setLogs([])}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex-1 p-0 overflow-hidden bg-neutral-950 text-neutral-300 font-mono text-sm border-t border-neutral-800">
          <ScrollArea className="h-full w-full p-4">
            <div className="space-y-0.5">
              {loading ? (
                <div className="space-y-2 pt-2">
                  <Skeleton className="h-4 w-full bg-neutral-800/50" />
                  <Skeleton className="h-4 w-3/4 bg-neutral-800/50" />
                  <Skeleton className="h-4 w-5/6 bg-neutral-800/50" />
                </div>
              ) : filteredLogs.length === 0 ? (
                <div className="text-neutral-500 italic">{t("empty")}</div>
              ) : (
                filteredLogs.map((log) => <LogItem key={log.id} log={log} />)
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
