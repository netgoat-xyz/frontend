import { HeaderSection } from "@/components/interface/domains/overview/HeaderSection";
import { TrafficOverview } from "@/components/interface/domains/analytics/TrafficOverview";
import { GeoBreakdown } from "@/components/interface/domains/analytics/GeoBreakdown";
import { HostnamesBreakdown } from "@/components/interface/domains/analytics/HostnamesBreakdown";
const AnalyticsPage = () => {
  const domainData = {
    name: "netgoat.xyz",
    status: "healthy",
    origin: "http://10.0.0.4:3000",
    certExp: "89 days",
    wafStatus: "Active",
  };

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
