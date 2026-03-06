import { HeaderSection } from "@/components/interface/domains/overview/HeaderSection";
import { OriginSettings } from "@/components/interface/domains/settings/OriginSettings";
import { CacheSettings } from "@/components/interface/domains/settings/CacheSettings";
import { PerformanceSettings } from "@/components/interface/domains/settings/PerformanceSettings";
import { DangerZone } from "@/components/interface/domains/settings/DangerZone";
import { loadDomainByRoute } from "../_lib/domain-data";

type Props = {
  params: {
    teamName: string
    domainName: string
  }
}

const SettingsPage = async ({ params }: Props) => {
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
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <OriginSettings />
        <CacheSettings />
      </div>
      <PerformanceSettings />
      <DangerZone />
    </div>
  );
};

export default SettingsPage;
