import { HeaderSection } from "@/components/interface/domains/overview/HeaderSection";
import { DnsRecords } from "@/components/interface/domains/dns/DnsRecords";
import { DnsNameservers } from "@/components/interface/domains/dns/DnsNameservers";

const DnsPage = () => {
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
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2">
          <DnsRecords />
        </div>
      </div>
    </div>
  );
};

export default DnsPage;
