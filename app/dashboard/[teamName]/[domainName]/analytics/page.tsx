import { HeaderSection } from "@/components/interface/domains/overview/HeaderSection";
import { TrafficOverview } from "@/components/interface/domains/analytics/TrafficOverview";
import { GeoBreakdown } from "@/components/interface/domains/analytics/GeoBreakdown";
import { HostnamesBreakdown } from "@/components/interface/domains/analytics/HostnamesBreakdown";
import { loadDomainByRoute } from "../_lib/domain-data";

type Props = {
  params: {
    teamName: string
    domainName: string
  }
}

const AnalyticsPage = async ({ params }: Props) => {
  const { teamName, domainName, domain, domainData } = await loadDomainByRoute(params)

  if (!domain || !domainData) {
    return (
      <div className="min-h-screen p-8">
        <h2 className="text-2xl font-semibold">Domain not found</h2>
        <p className="text-muted">No domain "{domainName}" found for team "{teamName}".</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <HeaderSection domainData={domainData} />

      <div className="mx-auto space-y-6">
        <TrafficOverview />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <GeoBreakdown />
                    <HostnamesBreakdown />

        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
