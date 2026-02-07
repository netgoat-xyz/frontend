"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { useReportWebVitals } from "next/web-vitals";
import { trackAnalytics } from "@/actions/analytics";

function getVisitorId() {
  if (typeof window === "undefined") return "server";
  let vid = localStorage.getItem("netgoat_vid");
  if (!vid) {
    vid = Math.random().toString(36).substring(2) + Date.now().toString(36);
    localStorage.setItem("netgoat_vid", vid);
  }
  return vid;
}

export default function SelfHostedAnalytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastPath = useRef<string | null>(null);

  useEffect(() => {
    const url = `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;

    trackAnalytics({
        type: "pageview",
        path: url,
        visitorId: getVisitorId()
    });
    
  }, [pathname, searchParams]);

  useReportWebVitals((metric) => {
    trackAnalytics({
        type: "web-vital",
        path: window.location.pathname,
        visitorId: getVisitorId(),
        metricName: metric.name,
        metricValue: metric.value,
        metricRating: metric.rating
    });
  });

  return null;
}
