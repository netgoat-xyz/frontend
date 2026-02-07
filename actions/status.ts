"use server";

import os from "os";

export interface ServiceStatus {
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
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch(url, {
      method: "HEAD",
      signal: controller.signal,
      cache: "no-store",
    });
    clearTimeout(timeout);
    return { ok: res.ok, latency: Date.now() - start };
  } catch {
    return { ok: false, latency: Date.now() - start };
  }
}

export async function getPublicStatus(): Promise<SystemStatus> {
  const uptimeSeconds = os.uptime();
  const hours = Math.floor(uptimeSeconds / 3600);
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;

  const uptimeStr =
    days > 0 ? `${days}d ${remainingHours}h` : `${remainingHours}h`;

  // Check services in parallel
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const apiUrl = process.env.EXTERNAL_API_URL || "http://localhost:3001";
  const docsUrl = "https://docs.netgoat.xyz";

  const [appCheck, apiCheck, docsCheck] = await Promise.all([
    checkEndpoint(appUrl),
    checkEndpoint(apiUrl),
    checkEndpoint(docsUrl),
  ]);

  const services: ServiceStatus[] = [
    {
      name: "Web Application",
      description: "Frontend dashboard and marketing site",
      status: appCheck.ok ? "operational" : "outage",
      latency: appCheck.latency,
    },
    {
      name: "API",
      description: "External REST API and agent communication",
      status: apiCheck.ok ? "operational" : "outage",
      latency: apiCheck.latency,
    },
    {
      name: "Documentation",
      description: "Developer documentation and guides",
      status: docsCheck.ok ? "operational" : "outage",
      latency: docsCheck.latency,
    },
    {
      name: "Edge Network",
      description: "Global reverse proxy and WAF nodes",
      status: "operational",
    },
    {
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
}
