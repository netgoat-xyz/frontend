import { HeaderSection } from "@/components/interface/domains/overview/HeaderSection";
import { loadDomainByRoute } from "../_lib/domain-data";
import { getTranslations } from "next-intl/server";

type Props = {
  params: {
    teamName: string
    domainName: string
  } | Promise<{ teamName: string, domainName: string }>
}

type Subdomain = {
  subdomain: string
  full_domain: string
  target_url: string
  request_count?: number
  active: boolean
}

const SubdomainsPage = async ({ params }: Props) => {
  const { teamName, domainName, domain, domainData } = await loadDomainByRoute(params)
  const t = await getTranslations("DashboardPages.subdomains")

  if (!domain || !domainData) {
    return (
      <div className="min-h-svh p-4 sm:p-6 lg:p-8">
        <h2 className="text-2xl font-semibold">{t("notFound.title")}</h2>
        <p className="text-muted">{t("notFound.description", { domainName, teamName })}</p>
      </div>
    )
  }

  const subdomains: Subdomain[] = domain.subdomains || [];

  return (
    <div className="space-y-6 min-h-svh">
      <HeaderSection domainData={domainData} />
      
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-6 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-semibold text-sm uppercase text-neutral-500 flex items-center gap-2">
            {t("title", { count: subdomains.length })}
          </h3>
          <button className="px-4 py-2 text-sm bg-indigo-500/10 border-indigo-500/30 border rounded-md text-indigo-400 hover:bg-indigo-500/20 transition-all cursor-pointer">
            {t("actions.add")}
          </button>
        </div>
        
        {subdomains.length > 0 ? (
          <div className="space-y-4">
            {subdomains.map((sub) => (
              <div key={sub.subdomain} className="flex justify-between items-center p-4 border border-neutral-100 dark:border-neutral-800 rounded-lg">
                <div>
                  <div className="font-medium text-sm">{sub.full_domain}</div>
                  <div className="text-xs text-neutral-500">{t("target")}: {sub.target_url}</div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-xs font-mono text-neutral-500">{t("requests", { count: sub.request_count || 0 })}</div>
                  <div className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${sub.active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-neutral-500/10 text-neutral-400'}`}>
                    {sub.active ? t("status.active") : t("status.inactive")}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center text-neutral-500 text-sm">
            {t("empty")}
          </div>
        )}
      </div>
    </div>
  );
};

export default SubdomainsPage;
