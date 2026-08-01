import { HeaderSection } from "@/components/interface/domains/overview/HeaderSection";
import { OriginSettings } from "@/components/interface/domains/settings/OriginSettings";
import { CacheSettings } from "@/components/interface/domains/settings/CacheSettings";
import { PerformanceSettings } from "@/components/interface/domains/settings/PerformanceSettings";
import { DangerZone } from "@/components/interface/domains/settings/DangerZone";
import { loadDomainByRoute } from "../_lib/domain-data";
import { getTranslations } from "next-intl/server";

type Props = {
  params: {
    teamName: string
    domainName: string
  }
}

const SettingsPage = async ({ params }: Props) => {
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
    <div className="space-y-6">
      <HeaderSection domainData={domainData} />
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <OriginSettings
          teamSlug={teamName}
          domainId={domain._id.toString()}
          initialTargetUrl={domain.target_url}
        />
        <CacheSettings
          teamSlug={teamName}
          domainId={domain._id.toString()}
          initialRoutePolicy={domain.route_policy}
        />
      </div>
      <PerformanceSettings />
      <DangerZone />
    </div>
  );
};

export default SettingsPage;
