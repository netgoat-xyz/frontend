import { HeaderSection } from "@/components/interface/domains/overview/HeaderSection";
import { WafModeSelector } from "@/components/interface/domains/waf/WafModeSelector";
import { WafStats } from "@/components/interface/domains/waf/WafStats";
import { WafEvents } from "@/components/interface/domains/waf/WafEvents";
import { WafRules } from "@/components/interface/domains/waf/WafRules";
import { loadDomainByRoute } from "../_lib/domain-data";

type Props = {
  params: {
    teamName: string
    domainName: string
  }
}

const WafPage = async ({ params }: Props) => {
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
