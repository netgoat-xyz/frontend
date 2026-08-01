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

  const subdomains = JSON.parse(JSON.stringify(domain.subdomains || []));
  const reverseProxies = JSON.parse(
    JSON.stringify([
      ...(Array.isArray(domain.proxy_configs) ? domain.proxy_configs : []),
      ...(Array.isArray(domain.subdomains)
        ? domain.subdomains.flatMap((subdomain) =>
            Array.isArray(subdomain?.proxy_configs)
              ? subdomain.proxy_configs.map((config) => ({
                  ...config,
                  subdomain: config?.subdomain || subdomain.subdomain,
                }))
              : [],
          )
        : []),
    ]),
  );

  return (
    <div className="space-y-6 min-h-svh">
      <HeaderSection domainData={domainData} />
      
      <div className="rounded-xl border border-neutral-800 bg-neutral-950/30 p-6">
        <ReverseProxiesClient 
           teamSlug={teamName}
           domainId={domain._id.toString()}
           domainName={domain.domain}
           primaryTarget={domain.target_url}
           reverseProxies={reverseProxies}
           subdomains={subdomains}
        />
      </div>
    </div>
  );
};

export default ReverseProxiesPage;
