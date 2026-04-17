"use server";

import os from "os";
import { unstable_cache } from "next/cache";

export type ServiceKey =
  | "webApplication"
  | "api"
  | "documentation"
  | "edgeNetwork"
  | "authentication";

export interface ServiceStatus {
  key: ServiceKey;
  name: string;
  description: string;
  status: "operational" | "degraded" | "outage" | "maintenance";
  latency?: number;
}

export interface SystemStatus {
  overall: "operational" | "degraded" | "outage" | "maintenance";
  services: ServiceStatus[];
  uptime: string;
  uptimeSeconds: number;
  checkedAt: string;
}

async function checkEndpoint(
  url: string,
  timeoutMs = 5000
): Promise<{ ok: boolean; latency: number }> {
  const start = Date.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      method: "HEAD",
      signal: controller.signal,
      cache: "no-store",
    });
    return { ok: res.ok, latency: Date.now() - start };
  } catch {
    return { ok: false, latency: Date.now() - start };
  } finally {
    clearTimeout(timeout);
  }
}

const getPublicStatusCached = unstable_cache(
  async (): Promise<SystemStatus> => {
    const uptimeSeconds = os.uptime();
    const hours = Math.floor(uptimeSeconds / 3600);
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;

    const uptimeStr =
      days > 0 ? `${days}d ${remainingHours}h` : `${remainingHours}h`;

    // Check services in parallel
    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      "http://localhost:3000";
    const apiUrl = process.env.EXTERNAL_API_URL || "http://localhost:3001";
    const docsUrl = new URL("/docs", appUrl).toString();

    const [appCheck, apiCheck, docsCheck] = await Promise.all([
      checkEndpoint(appUrl),
      checkEndpoint(apiUrl),
      checkEndpoint(docsUrl),
    ]);

    const services: ServiceStatus[] = [
      {
        key: "webApplication",
        name: "Web Application",
        description: "Frontend dashboard and marketing site",
        status: appCheck.ok ? "operational" : "outage",
        latency: appCheck.latency,
      },
      {
        key: "api",
        name: "API",
        description: "External REST API and agent communication",
        status: apiCheck.ok ? "operational" : "outage",
        latency: apiCheck.latency,
      },
      {
        key: "documentation",
        name: "Documentation",
        description: "Developer documentation and guides",
        status: docsCheck.ok ? "operational" : "outage",
        latency: docsCheck.latency,
      },
      {
        key: "edgeNetwork",
        name: "Edge Network",
        description: "Global reverse proxy and WAF nodes",
        status: "operational",
      },
      {
        key: "authentication",
        name: "Authentication",
        description: "User authentication and session management",
        status: appCheck.ok ? "operational" : "degraded",
      },
    ];

    const hasOutage = services.some((s) => s.status === "outage");
    const hasDegraded = services.some((s) => s.status === "degraded");
    const hasMaintenance = services.some((s) => s.status === "maintenance");

    let overall: SystemStatus["overall"] = "operational";
    if (hasOutage) overall = "outage";
    else if (hasDegraded) overall = "degraded";
    else if (hasMaintenance) overall = "maintenance";

    return {
      overall,
      services,
      uptime: uptimeStr,
      uptimeSeconds,
      checkedAt: new Date().toISOString(),
    };
  },
  ["public-status"],
  { revalidate: 30, tags: ["public-status"] },
);

export async function getPublicStatus(): Promise<SystemStatus> {
  return getPublicStatusCached();
}
