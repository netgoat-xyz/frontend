"use client";

import { ChartAreaInteractive } from "@/components/chart-area-interactive";
import { useEffect, useState } from "react";
import axios from "axios";
import { SectionCards } from "@/components/section-cards";
import config from "../../../public/config.json";

interface DashboardPageProps {
  params: Promise<{ domain: string; slug: string }>;
}

interface ClientData {
  date: string;
  mobile: number;
  desktop: number;
}

interface CacheData {
  date: string;
  hit: number;
  miss: number;
}

const cacheData: CacheData[] = [
  { date: "2025-06-01", hit: 100, miss: 20 },
  { date: "2025-06-02", hit: 120, miss: 25 },
  { date: "2025-06-03", hit: 150, miss: 30 },
];

const isMobile = (ua: string) => /iPhone|iPad|iPod|Android|Mobile/i.test(ua);

const parseTimestamp = (t: string) => {
  if (!t) return null;
  const [d, time] = t.split(" ");
  return new Date(`${d}T${time}`);
};

export default function DashboardPage({ params }: DashboardPageProps) {
  const [slug, setSlug] = useState<string>("");
  const [clients, setClients] = useState<ClientData[]>([]);
  const [timeRange, setTimeRange] = useState<string>("3mo");
  const [isLoading, setIsLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);
  const [analyticals, setAnalyticals] = useState<any>(null); 

  useEffect(() => setIsClient(true), []);

  // Resolve async params
  useEffect(() => {
    const resolveParams = async () => {
      const resolvedParams = await params;
      setSlug(resolvedParams.slug);
    };
    resolveParams();
  }, [params]);

  // Fetch live logs from LogDB
  useEffect(() => {
    if (!isClient || !slug) return;
  })
  useEffect(() => setIsClient(true), []);

  useEffect(() => {
    const resolveParams = async () => {
      const p = await params;
      setSlug(p.slug);
    };
    resolveParams();
  }, [params]);

  useEffect(() => {
    if (!isClient || !slug) return;

    const fetchLogs = async () => {
      try {
        setIsLoading(true);
        const jwt = localStorage.getItem("jwt");
        if (!jwt) throw new Error("JWT missing");

        const backendUrl = config.backend || "http://localhost:3001";

        const res = await axios.get(
          `${backendUrl}/api/v1/logs?domain=${slug}`,
          { headers: { Authorization: `Bearer ${jwt}` } }
        );

        const logs = res.data.logs;
        const daily: Record<string, { mobile: number; desktop: number }> = {};

        for (const log of logs) {
          const dt = parseTimestamp(log.timestamp);
          if (!dt) continue;
          const key = dt.toISOString().slice(0, 10);
          if (!daily[key]) daily[key] = { mobile: 0, desktop: 0 };
          isMobile(log.userAgent || "")
            ? daily[key].mobile++
            : daily[key].desktop++;
        }

        const out = Object.entries(daily).map(([date, counts]) => ({
          date,
          ...counts,
        }));

        out.sort((a, b) => new Date(a.date) - new Date(b.date));
        
        setAnalyticals(res)
        setClients(out);
      } catch (err) {
        console.error("Failed to fetch logs:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLogs();
  }, [slug, timeRange, isClient]);

  const visitorConfig = {
    visitors: { label: "Visitors" },
    desktop: { label: "Desktop", color: "var(--primary)" },
    mobile: { label: "Mobile", color: "var(--primary)" },
  };

  const cacheConfig = {
    cache: { label: "Cache" },
    hit: { label: "Cache Hits", color: "var(--primary)" },
    miss: { label: "Cache Miss", color: "var(--primary)" },
  };

  if (!isClient || !slug || isLoading) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center">
        <div className="text-muted-foreground">Loading analytics...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <SectionCards />
          <div className="px-4 lg:px-6">
            <ChartAreaInteractive
              title="Total visitors"
              description="Total for the last 3 months"
              cc={visitorConfig}
              chartData={clients}
              areaKeys={[
                {
                  key: "mobile",
                  color: "var(--color-mobile)",
                  gradient: "fillMobile",
                },
                {
                  key: "desktop",
                  color: "var(--color-desktop)",
                  gradient: "fillDesktop",
                },
              ]}
              timeRange={timeRange}
              setTimeRange={setTimeRange}
            />
          </div>
          <div className="px-4 lg:px-6">
            <ChartAreaInteractive
              title="Caching Total"
              description="Cache data for the last 3 months"
              cc={cacheConfig}
              chartData={cacheData}
              areaKeys={[
                { key: "hit", color: "var(--color-hit)", gradient: "fillHit" },
                {
                  key: "miss",
                  color: "var(--color-miss)",
                  gradient: "fillMiss",
                },
              ]}
              timeRange="3mo"
              setTimeRange={() => {}}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
