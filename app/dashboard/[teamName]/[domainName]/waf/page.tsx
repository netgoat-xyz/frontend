import { HeaderSection } from "@/components/interface/domains/overview/HeaderSection";
import { WafModeSelector } from "@/components/interface/domains/waf/WafModeSelector";
import { WafStats } from "@/components/interface/domains/waf/WafStats";
import { WafEvents } from "@/components/interface/domains/waf/WafEvents";
import { WafRules } from "@/components/interface/domains/waf/WafRules";
import { loadDomainByRoute } from "../_lib/domain-data";
import { getTranslations } from "next-intl/server";

type Props = {
  params: {
    teamName: string
    domainName: string
  }
}

const WafPage = async ({ params }: Props) => {
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
      <WafStats />
      <WafModeSelector />
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2">
          <WafEvents />
        </div>
        <WafRules rules={domain.waf_rules || []} />
      </div>
    </div>
  );
};

export default WafPage;
