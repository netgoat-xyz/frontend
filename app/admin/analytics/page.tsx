import { getDashboardStats } from "@/actions/analytics";
import AnalyticsDashboard from "@/components/interface/admin/AnalyticsDashboard";
import { getGlobalSettings } from "@/actions/adminValues";

export const dynamic = "force-dynamic";

export default async function AdminAnalyticsPage(props: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const searchParams = await props.searchParams;
  const range = (searchParams.range as "24h" | "7d" | "30d") || "24h";

  // Ensure admin via middleware or check here if strictly needed, 
  // but simpler to reuse the check inside getDashboardStats if we added it there.
  // Actually getDashboardStats doesn't have auth check yet, so let's add one or rely on layout.
  // getGlobalSettings calls checkAdmin() so we can use it as a gatekeeper
  await getGlobalSettings();

  const stats = await getDashboardStats(range);

  return <AnalyticsDashboard stats={stats} timeRange={range} />;
}
