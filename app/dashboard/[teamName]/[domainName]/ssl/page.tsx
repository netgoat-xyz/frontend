import { HeaderSection } from "@/components/interface/domains/overview/HeaderSection";
import { SslCertificate } from "@/components/interface/domains/ssl/SslCertificate";
import { SslHealthCheck } from "@/components/interface/domains/ssl/SslHealthCheck";
import { loadDomainByRoute } from "../_lib/domain-data";

type Props = {
  params: {
    teamName: string
    domainName: string
  }
}

const SslPage = async ({ params }: Props) => {
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
      <SslCertificate />
      <SslHealthCheck />
    </div>
  );
};

export default SslPage;
