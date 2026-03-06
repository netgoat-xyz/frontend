import { HeaderSection } from "@/components/interface/domains/overview/HeaderSection";
import { LogFilters } from "@/components/interface/domains/logs/LogFilters";
import { LogTable } from "@/components/interface/domains/logs/LogTable";
import { LogStats } from "@/components/interface/domains/logs/LogStats";
import { loadDomainByRoute } from "../_lib/domain-data";

type Props = {
  params: {
    teamName: string
    domainName: string
  }
}

const LogsPage = async ({ params }: Props) => {
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
    <div className="space-y-6">
      <HeaderSection domainData={domainData} />
      <LogStats domainStats={domain.stats} />
      <LogFilters />
      <LogTable />
    </div>
  );
};

export default LogsPage;
