"use server";

import dbConnect from "@/lib/mongoose";
import Analytics from "@/models/Analytics";
import { checkAdmin } from "./adminValues";
import { headers } from "next/headers";

type AnalyticsPayload = {
  type: "pageview" | "web-vital";
  path: string;
  visitorId: string;
  referrer?: string;
  metricName?: string;
  metricValue?: number;
  metricRating?: string;
};

export async function trackAnalytics(data: AnalyticsPayload) {
  try {
    await dbConnect();

    const headersList = await headers();
    const ua = headersList.get("user-agent") || "";

    // Simple device detection
    let device = "desktop";
    if (/mobile/i.test(ua)) device = "mobile";
    else if (/tablet|ipad/i.test(ua)) device = "tablet";

    await Analytics.create({
      type: data.type,
      path: data.path,
      visitorId: data.visitorId,
      referrer: data.referrer,
      userAgent: ua,
      device,
      metricName: data.metricName,
      metricValue: data.metricValue,
      metricRating: data.metricRating,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error("Failed to track analytics:", error);
    // Don't throw, we don't want to break the app for metrics
  }
}

export async function getAnalyticsMetadata() {
  await dbConnect();
  // Simply return counts for now to verify it works
  const totalViews = await Analytics.countDocuments({ type: "pageview" });
  return { totalViews };
}

export async function getDashboardStats(
  timeRange: "24h" | "7d" | "30d" = "24h",
) {
  await checkAdmin();

  const now = new Date();
  let startDate = new Date();

  if (timeRange === "24h") startDate.setHours(now.getHours() - 24);
  if (timeRange === "7d") startDate.setDate(now.getDate() - 7);
  if (timeRange === "30d") startDate.setDate(now.getDate() - 30);

  const matchStage = { timestamp: { $gte: startDate } };
  const [
    uniqueVisitors,
    totalPageViews,
    topPages,
    avgLCP,
    topReferrers,
    viewsOverTime,
    visitorPageCounts,
    pagesPerformance,
    deviceStats,
  ] = await Promise.all([
    Analytics.distinct("visitorId", {
      ...matchStage,
      type: "pageview",
    }),
    Analytics.countDocuments({
      ...matchStage,
      type: "pageview",
    }),
    Analytics.aggregate([
      { $match: { ...matchStage, type: "pageview" } },
      { $group: { _id: "$path", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]),
    Analytics.aggregate([
      { $match: { ...matchStage, type: "web-vital", metricName: "LCP" } },
      { $group: { _id: null, avg: { $avg: "$metricValue" } } },
    ]),
    Analytics.aggregate([
      {
        $match: {
          ...matchStage,
          type: "pageview",
          referrer: { $nin: [null, ""] },
        },
      },
      { $group: { _id: "$referrer", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]),
    Analytics.aggregate([
      { $match: { ...matchStage, type: "pageview" } },
      {
        $group: {
          _id: {
            $dateToString: {
              format: timeRange === "24h" ? "%H:00" : "%Y-%m-%d",
              date: "$timestamp",
            },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    Analytics.aggregate([
      { $match: { ...matchStage, type: "pageview" } },
      { $group: { _id: "$visitorId", count: { $sum: 1 } } },
    ]),
    Analytics.aggregate([
      { $match: { ...matchStage, type: "web-vital" } },
      {
        $group: {
          _id: { path: "$path", metric: "$metricName" },
          avgValue: { $avg: "$metricValue" },
          count: { $sum: 1 },
        },
      },
      {
        $group: {
          _id: "$_id.path",
          metrics: {
            $push: {
              name: "$_id.metric",
              value: "$avgValue",
              count: "$count",
            },
          },
          totalSamples: { $sum: "$count" },
        },
      },
      { $sort: { totalSamples: -1 } },
    ]),
    Analytics.aggregate([
      { $match: { ...matchStage, type: "pageview" } },
      { $group: { _id: "$device", count: { $sum: 1 } } },
    ]),
  ]);

  // Calculate bounce rate (single-page sessions / total sessions)
  const totalSessions = visitorPageCounts.length;
  const singlePageSessions = visitorPageCounts.filter((v) => v.count === 1).length;
  const bounceRate = totalSessions > 0 ? (singlePageSessions / totalSessions) * 100 : 0;

  return {
    visitors: uniqueVisitors.length,
    pageViews: totalPageViews,
    webVitals: {
      lcp: avgLCP[0]?.avg || 0,
    },
    topPages: topPages.map((p) => ({ path: p._id, count: p.count })),
    topReferrers: topReferrers.map((r) => ({ url: r._id, count: r.count })),
    chartData: viewsOverTime.map((v) => ({ date: v._id, views: v.count })),
    deviceStats: deviceStats.map((d) => ({ device: d._id, count: d.count })),
    bounceRate: Math.round(bounceRate),
    pagesPerformance: pagesPerformance.map((p) => ({
      path: p._id,
      metrics: p.metrics.reduce((acc: any, m: any) => {
        acc[m.name] = Math.round(m.value * 100) / 100; // Round to 2 decimals
        return acc;
      }, {}),
    })),
  };
}
