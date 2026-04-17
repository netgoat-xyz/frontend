"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { useReportWebVitals } from "next/web-vitals";

type AnalyticsPayload = {
  type: "pageview" | "web-vital";
  path: string;
  visitorId: string;
  referrer?: string;
  metricName?: string;
  metricValue?: number;
  metricRating?: string;
};

const TRACKED_WEB_VITALS = new Set(["LCP", "INP", "CLS"]);

function getVisitorId() {
  if (typeof window === "undefined") return "server";
  let vid = localStorage.getItem("netgoat_vid");
  if (!vid) {
    vid = Math.random().toString(36).substring(2) + Date.now().toString(36);
    localStorage.setItem("netgoat_vid", vid);
  }
  return vid;
}

function sendAnalytics(payload: AnalyticsPayload) {
  if (typeof window === "undefined") return;

  const body = JSON.stringify(payload);

  try {
    if (navigator.sendBeacon) {
      const blob = new Blob([body], { type: "application/json" });
      navigator.sendBeacon("/api/analytics", blob);
      return;
    }
  } catch {
    // Fall back to fetch if beacon fails.
  }

  void fetch("/api/analytics", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body,
    keepalive: true,
    cache: "no-store",
  }).catch(() => {
    // Analytics failures should never affect UX.
  });
}

export default function SelfHostedAnalytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastPath = useRef<string | null>(null);
  const sentVitals = useRef<Set<string>>(new Set());

  useEffect(() => {
    const url = `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;

    if (lastPath.current === url) {
      return;
    }

    lastPath.current = url;

    sendAnalytics({
      type: "pageview",
      path: url,
      visitorId: getVisitorId(),
      referrer: document.referrer || undefined,
    });
  }, [pathname, searchParams]);

  useReportWebVitals((metric) => {
    if (!TRACKED_WEB_VITALS.has(metric.name)) {
      return;
    }

    const metricKey = `${metric.id}:${metric.name}`;
    if (sentVitals.current.has(metricKey)) {
      return;
    }

    sentVitals.current.add(metricKey);

    sendAnalytics({
      type: "web-vital",
      path: window.location.pathname,
      visitorId: getVisitorId(),
      metricName: metric.name,
      metricValue: metric.value,
      metricRating: metric.rating,
    });
  });

  return null;
}
