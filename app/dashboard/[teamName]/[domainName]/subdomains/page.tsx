import { HeaderSection } from "@/components/interface/domains/overview/HeaderSection";
import { loadDomainByRoute } from "../_lib/domain-data";
import { Activity, Shield } from "lucide-react";

type Props = {
  params: {
    teamName: string
    domainName: string
  } | Promise<{ teamName: string, domainName: string }>
}

const SubdomainsPage = async ({ params }: Props) => {
  const { teamName, domainName, domain, domainData } = await loadDomainByRoute(params)

  if (!domain || !domainData) {
    return (
      <div className="min-h-screen p-8">
        <h2 className="text-2xl font-semibold">Domain not found</h2>
        <p className="text-muted">No domain "{domainName}" found for team "{teamName}".</p>
      </div>
    )
  }

  const subdomains = domain.subdomains || [];

  return (
    <div className="space-y-6 min-h-screen">
      <HeaderSection domainData={domainData} />
      
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-6 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-semibold text-sm uppercase text-neutral-500 flex items-center gap-2">
            Subdomains ({subdomains.length})
          </h3>
          <button className="px-4 py-2 text-sm bg-indigo-500/10 border-indigo-500/30 border rounded-md text-indigo-400 hover:bg-indigo-500/20 transition-all cursor-pointer">
            Add Subdomain
          </button>
        </div>
        
        {subdomains.length > 0 ? (
          <div className="space-y-4">
            {subdomains.map((sub: any) => (
              <div key={sub.subdomain} className="flex justify-between items-center p-4 border border-neutral-100 dark:border-neutral-800 rounded-lg">
                <div>
                  <div className="font-medium text-sm">{sub.full_domain}</div>
                  <div className="text-xs text-neutral-500">Target: {sub.target_url}</div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-xs font-mono text-neutral-500">{sub.request_count || 0} reqs</div>
                  <div className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${sub.active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-neutral-500/10 text-neutral-400'}`}>
                    {sub.active ? 'Active' : 'Inactive'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center text-neutral-500 text-sm">
            No subdomains configured yet.
          </div>
        )}
      </div>
    </div>
  );
};

export default SubdomainsPage;
