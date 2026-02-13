import { HeaderSection } from "@/components/interface/domains/overview/HeaderSection";
import { SslCertificate } from "@/components/interface/domains/ssl/SslCertificate";
import { SslHealthCheck } from "@/components/interface/domains/ssl/SslHealthCheck";

const SslPage = () => {
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
      <SslCertificate />
      <SslHealthCheck />
    </div>
  );
};

export default SslPage;
