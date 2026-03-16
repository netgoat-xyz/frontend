import { HeaderSection } from "@/components/interface/domains/overview/HeaderSection";
import { loadDomainByRoute } from "../_lib/domain-data";
import { ReverseProxiesClient } from "./ReverseProxiesClient";
import { getTranslations } from "next-intl/server";

type Props = {
  params: {
    teamName: string
    domainName: string
  } | Promise<{ teamName: string, domainName: string }>
}

const ReverseProxiesPage = async ({ params }: Props) => {
  const { teamName, domainName, domain, domainData } = await loadDomainByRoute(params)
  const t = await getTranslations("DashboardPages.reverseProxy")

  if (!domain || !domainData) {
    return (
      <div className="min-h-svh p-4 sm:p-6 lg:p-8">
        <h2 className="text-2xl font-semibold">{t("notFound.title")}</h2>
        <p className="text-muted">{t("notFound.description", { domainName, teamName })}</p>
      </div>
    )
  }

  // Use domain.reverse_proxies array now included in DomainSchema
  const reverseProxies = JSON.parse(JSON.stringify(domain.reverse_proxies || []));

  return (
    <div className="space-y-6 min-h-svh">
      <HeaderSection domainData={domainData} />
      
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-6 shadow-sm">
        <ReverseProxiesClient 
           teamSlug={teamName} 
           domainId={domain._id.toString()} 
           reverseProxies={reverseProxies} 
        />
        
        {domain.target_url && (
           <div className="mt-8 pt-6 border-t border-neutral-100 dark:border-neutral-800 flex justify-between items-center text-sm">
             <span className="text-neutral-500">{t("fallbackTarget")}</span>
             <span className="font-mono text-neutral-900 dark:text-neutral-100 bg-neutral-100 dark:bg-neutral-800 px-3 py-1.5 rounded-md">{domain.target_url}</span>
           </div>
        )}
      </div>
    </div>
  );
};

export default ReverseProxiesPage;
