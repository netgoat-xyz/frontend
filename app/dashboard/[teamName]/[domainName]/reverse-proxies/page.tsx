import { HeaderSection } from "@/components/interface/domains/overview/HeaderSection";
import { loadDomainByRoute } from "../_lib/domain-data";
import { ReverseProxiesClient } from "./ReverseProxiesClient";

type Props = {
  params: {
    teamName: string
    domainName: string
  } | Promise<{ teamName: string, domainName: string }>
}

const ReverseProxiesPage = async ({ params }: Props) => {
  const { teamName, domainName, domain, domainData } = await loadDomainByRoute(params)

  if (!domain || !domainData) {
    return (
      <div className="min-h-screen p-8">
        <h2 className="text-2xl font-semibold">Domain not found</h2>
        <p className="text-muted">No domain "{domainName}" found for team "{teamName}".</p>
      </div>
    )
  }

  // Use domain.reverse_proxies array now included in DomainSchema
  const reverseProxies = JSON.parse(JSON.stringify(domain.reverse_proxies || []));

  return (
    <div className="space-y-6 min-h-screen">
      <HeaderSection domainData={domainData} />
      
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-6 shadow-sm">
        <ReverseProxiesClient 
           teamSlug={teamName} 
           domainId={domain._id.toString()} 
           reverseProxies={reverseProxies} 
        />
        
        {domain.target_url && (
           <div className="mt-8 pt-6 border-t border-neutral-100 dark:border-neutral-800 flex justify-between items-center text-sm">
             <span className="text-neutral-500">Fallback Root Target URL</span>
             <span className="font-mono text-neutral-900 dark:text-neutral-100 bg-neutral-100 dark:bg-neutral-800 px-3 py-1.5 rounded-md">{domain.target_url}</span>
           </div>
        )}
      </div>
    </div>
  );
};

export default ReverseProxiesPage;
