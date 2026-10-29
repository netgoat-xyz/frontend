import type { Metadata } from "next";

import { AnalyticsDashboard } from "@/components/admin/analytics-dashboard";
import { PageHeader } from "@/components/dashboard/page-header";
import {
  getAdminAnalytics,
  isAnalyticsRange,
} from "@/lib/data/admin-analytics";

export const metadata: Metadata = {
  title: "Analytics",
};

export const dynamic = "force-dynamic";

export default async function AdminAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const params = await searchParams;
  const range = isAnalyticsRange(params.range) ? params.range : "24h";
  const stats = await getAdminAnalytics(range);

  return (
    <>
      <PageHeader
        title="Analytics"
        description="Aggregated from the first-party pageview collection — unique visitors, bounce rate, top paths and web vitals."
      />
      <AnalyticsDashboard stats={stats} />
    </>
  );
}
