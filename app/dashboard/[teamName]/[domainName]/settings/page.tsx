import { HeaderSection } from "@/components/interface/domains/overview/HeaderSection";
import { OriginSettings } from "@/components/interface/domains/settings/OriginSettings";
import { CacheSettings } from "@/components/interface/domains/settings/CacheSettings";
import { PerformanceSettings } from "@/components/interface/domains/settings/PerformanceSettings";
import { DangerZone } from "@/components/interface/domains/settings/DangerZone";

const SettingsPage = () => {
  const domainData = {
    name: "netgoat.xyz",
    status: "healthy",
    origin: "http://10.0.0.4:3000",
    certExp: "89 days",
    wafStatus: "Active",
  };

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
