"use client";

import { useEffect, useState, useRef } from "react";
import {
  Terminal,
  Pause,
  Play,
  Trash2
} from "lucide-react";
import { getServerLogs } from "@/actions/adminValues";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [polling, setPolling] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchLogs = async () => {
    try {
      const data = await getServerLogs();
      setLogs(data);
    } catch (e) {
      console.error("Failed to fetch logs", e);
    }
  };

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(() => {
      if (polling) fetchLogs();
    }, 2000);
    return () => clearInterval(interval);
  }, [polling]);

  return (
    <Card className="h-[calc(100vh-200px)] flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="space-y-1">
          <CardTitle className="text-xl flex items-center gap-2">
            <Terminal className="h-5 w-5" /> Live Server Logs
          </CardTitle>
          <CardDescription>Realtime logs captured from the server instance.</CardDescription>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant={polling ? "default" : "secondary"}>
             {polling ? "Live" : "Paused"}
          </Badge>
          <Button variant="outline" size="sm" onClick={() => setPolling(!polling)}>
            {polling ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
          <Button variant="outline" size="sm" onClick={() => setLogs([])}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-0 overflow-hidden bg-black text-green-400 font-mono text-sm">
        <ScrollArea className="h-full w-full p-4">
          <div className="space-y-1">
            {logs.length === 0 && <div className="text-neutral-500 italic">No logs captured yet...</div>}
            {logs.map((log) => (
              <div key={log.id} className="break-all whitespace-pre-wrap flex gap-2">
                <span className="text-neutral-500 shrink-0">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                <span className={`shrink-0 font-bold ${
                  log.level === 'error' ? 'text-red-500' : 
                  log.level === 'warn' ? 'text-yellow-500' : 'text-blue-400'
                }`}>
                  {log.level.toUpperCase()}
                </span>
                <span>{log.message}</span>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
