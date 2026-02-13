import { HeaderSection } from "@/components/interface/domains/overview/HeaderSection";
import { LogFilters } from "@/components/interface/domains/logs/LogFilters";
import { LogTable } from "@/components/interface/domains/logs/LogTable";
import { LogStats } from "@/components/interface/domains/logs/LogStats";

const LogsPage = () => {
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
      <LogStats />
      <LogFilters />
      <LogTable />
    </div>
  );
};

export default LogsPage;
