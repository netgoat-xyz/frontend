import dbConnect from "@/lib/mongoose";
import Analytics from "@/models/Analytics";

export const ANALYTICS_RANGES = ["24h", "7d", "30d"] as const;
export type AnalyticsRange = (typeof ANALYTICS_RANGES)[number];

export function isAnalyticsRange(value: unknown): value is AnalyticsRange {
  return (
    typeof value === "string" &&
    (ANALYTICS_RANGES as readonly string[]).includes(value)
  );
}

export type AdminAnalytics = {
  range: AnalyticsRange;
  visitors: number;
  pageViews: number;
  bounceRate: number;
  webVitals: { lcp: number; inp: number; cls: number };
  chartData: Array<{ label: string; views: number }>;
  topPages: Array<{ path: string; count: number }>;
  topReferrers: Array<{ url: string; count: number }>;
  deviceStats: Array<{ device: string; count: number }>;
  pagesPerformance: Array<{
    path: string;
    lcp: number;
    inp: number;
    cls: number;
    samples: number;
  }>;
};

const RANGE_HOURS: Record<AnalyticsRange, number> = {
  "24h": 24,
  "7d": 24 * 7,
  "30d": 24 * 30,
};

function round(value: number, digits = 0): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

/**
 * Dashboard aggregates over the self-hosted analytics collection.
 *
 * Same metric definitions as before (bounce rate = single-page visitors /
 * all visitors, web vitals averaged per metric) but computed with typed
 * aggregation pipelines against the real reported data — no placeholders.
 */
export async function getAdminAnalytics(
  range: AnalyticsRange,
): Promise<AdminAnalytics> {
  await dbConnect();

  const startDate = new Date(Date.now() - RANGE_HOURS[range] * 60 * 60 * 1000);
  const pageviewMatch: { type: "pageview"; timestamp: { $gte: Date } } = {
    type: "pageview",
    timestamp: { $gte: startDate },
  };
  const bucketFormat = range === "24h" ? "%H:00" : "%m-%d";

  const [
    visitorRows,
    pageViews,
    topPages,
    topReferrers,
    chartRows,
    bounceRows,
    deviceRows,
    vitalRows,
    performanceRows,
  ] = await Promise.all([
    Analytics.aggregate<{ visitors: number }>([
      { $match: pageviewMatch },
      { $group: { _id: "$visitorId" } },
      { $count: "visitors" },
    ]),

    Analytics.countDocuments(pageviewMatch),

    Analytics.aggregate<{ _id: string; count: number }>([
      { $match: pageviewMatch },
      { $group: { _id: "$path", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]),

    Analytics.aggregate<{ _id: string; count: number }>([
      { $match: { ...pageviewMatch, referrer: { $nin: [null, ""] } } },
      { $group: { _id: "$referrer", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]),

    Analytics.aggregate<{ _id: string; views: number }>([
      { $match: pageviewMatch },
      {
        $group: {
          _id: {
            $dateToString: { format: bucketFormat, date: "$timestamp" },
          },
          views: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),

    Analytics.aggregate<{ total: number; singles: number }>([
      { $match: pageviewMatch },
      { $group: { _id: "$visitorId", views: { $sum: 1 } } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          singles: { $sum: { $cond: [{ $eq: ["$views", 1] }, 1, 0] } },
        },
      },
    ]),

    Analytics.aggregate<{ _id: string; count: number }>([
      { $match: pageviewMatch },
      { $group: { _id: { $ifNull: ["$device", "desktop"] }, count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),

    Analytics.aggregate<{ _id: string; average: number }>([
      {
        $match: {
          type: "web-vital",
          timestamp: { $gte: startDate },
          metricName: { $in: ["LCP", "INP", "CLS"] },
        },
      },
      { $group: { _id: "$metricName", average: { $avg: "$metricValue" } } },
    ]),

    Analytics.aggregate<{
      _id: string;
      metrics: Array<{ metric: string; average: number }>;
      samples: number;
    }>([
      { $match: { type: "web-vital", timestamp: { $gte: startDate } } },
      {
        $group: {
          _id: { path: "$path", metric: "$metricName" },
          average: { $avg: "$metricValue" },
          count: { $sum: 1 },
        },
      },
      {
        $group: {
          _id: "$_id.path",
          metrics: {
            $push: { metric: "$_id.metric", average: "$average" },
          },
          samples: { $sum: "$count" },
        },
      },
      { $sort: { samples: -1 } },
      { $limit: 5 },
    ]),
  ]);

  const vitals: Record<string, number> = {};
  for (const row of vitalRows) {
    if (row._id) vitals[row._id] = row.average ?? 0;
  }

  const bounce = bounceRows[0];
  const bounceRate =
    bounce && bounce.total > 0 ? round((bounce.singles / bounce.total) * 100) : 0;

  return {
    range,
    visitors: visitorRows[0]?.visitors ?? 0,
    pageViews,
    bounceRate,
    webVitals: {
      lcp: round(vitals.LCP ?? 0),
      inp: round(vitals.INP ?? 0),
      cls: round(vitals.CLS ?? 0, 2),
    },
    chartData: chartRows.map((row) => ({
      label: row._id ?? "",
      views: row.views ?? 0,
    })),
    topPages: topPages.map((row) => ({
      path: row._id ?? "/",
      count: row.count ?? 0,
    })),
    topReferrers: topReferrers.map((row) => ({
      url: row._id ?? "",
      count: row.count ?? 0,
    })),
    deviceStats: deviceRows.map((row) => ({
      device: row._id || "desktop",
      count: row.count ?? 0,
    })),
    pagesPerformance: performanceRows.map((row) => {
      const lookup: Record<string, number> = {};
      for (const metric of row.metrics ?? []) {
        if (metric.metric) lookup[metric.metric] = metric.average ?? 0;
      }
      return {
        path: row._id || "/",
        lcp: round(lookup.LCP ?? 0),
        inp: round(lookup.INP ?? 0),
        cls: round(lookup.CLS ?? 0, 2),
        samples: row.samples ?? 0,
      };
    }),
  };
}
