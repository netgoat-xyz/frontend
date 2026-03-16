import { HeaderSection } from "@/components/interface/domains/overview/HeaderSection";
import { TrafficOverview } from "@/components/interface/domains/analytics/TrafficOverview";
import { GeoBreakdown } from "@/components/interface/domains/analytics/GeoBreakdown";
import { HostnamesBreakdown } from "@/components/interface/domains/analytics/HostnamesBreakdown";
import { loadDomainByRoute } from "../_lib/domain-data";
import { getTranslations } from "next-intl/server";

type Props = {
  params: {
    teamName: string
    domainName: string
  }
}

const AnalyticsPage = async ({ params }: Props) => {
  const { teamName, domainName, domain, domainData } = await loadDomainByRoute(params)
  const t = await getTranslations("DashboardPages.domain")

  if (!domain || !domainData) {
    return (
      <div className="min-h-svh p-4 sm:p-6 lg:p-8">
        <h2 className="text-2xl font-semibold">{t("notFound.title")}</h2>
        <p className="text-muted">{t("notFound.description", { domainName, teamName })}</p>
      </div>
    )
  }

  return (
    <div className="min-h-svh">
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
