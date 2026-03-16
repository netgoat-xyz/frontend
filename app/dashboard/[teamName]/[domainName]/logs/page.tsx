import { HeaderSection } from "@/components/interface/domains/overview/HeaderSection";
import { LogFilters } from "@/components/interface/domains/logs/LogFilters";
import { LogTable } from "@/components/interface/domains/logs/LogTable";
import { LogStats } from "@/components/interface/domains/logs/LogStats";
import { loadDomainByRoute } from "../_lib/domain-data";
import { getTranslations } from "next-intl/server";

type Props = {
  params: {
    teamName: string
    domainName: string
  }
}

const LogsPage = async ({ params }: Props) => {
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
      <LogStats domainStats={domain.stats} />
      <LogFilters />
      <LogTable />
    </div>
  );
};

export default LogsPage;
