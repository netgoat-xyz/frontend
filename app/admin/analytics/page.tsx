import { getDashboardStats } from "@/actions/analytics";
import nextDynamic from "next/dynamic";

const AnalyticsDashboard = nextDynamic(
  () => import("@/components/interface/admin/AnalyticsDashboard"),
  {
    loading: () => (
      <div className="space-y-4 p-6">
        <div className="h-10 w-72 rounded-lg bg-muted/40" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="h-28 rounded-xl bg-muted/30" />
          <div className="h-28 rounded-xl bg-muted/30" />
          <div className="h-28 rounded-xl bg-muted/30" />
          <div className="h-28 rounded-xl bg-muted/30" />
        </div>
        <div className="h-80 rounded-xl bg-muted/30" />
      </div>
    ),
  }
);

export const dynamic = "force-dynamic";

export default async function AdminAnalyticsPage(props: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const searchParams = await props.searchParams;
  const range = (searchParams.range as "24h" | "7d" | "30d") || "24h";

  const stats = await getDashboardStats(range);

  return <AnalyticsDashboard stats={stats} timeRange={range} />;
}
