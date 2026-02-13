import { HeaderSection } from "@/components/interface/domains/overview/HeaderSection";
import { WafModeSelector } from "@/components/interface/domains/waf/WafModeSelector";
import { WafStats } from "@/components/interface/domains/waf/WafStats";
import { WafEvents } from "@/components/interface/domains/waf/WafEvents";
import { WafRules } from "@/components/interface/domains/waf/WafRules";

const WafPage = () => {
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
      <WafStats />
      <WafModeSelector />
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2">
          <WafEvents />
        </div>
        <WafRules />
      </div>
    </div>
  );
};

export default WafPage;
