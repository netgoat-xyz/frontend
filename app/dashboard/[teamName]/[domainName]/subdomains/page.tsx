import { HeaderSection } from "@/components/interface/domains/overview/HeaderSection";
import { loadDomainByRoute } from "../_lib/domain-data";
import { SubdomainsClient } from "./SubdomainsClient";
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
      
      <div className="rounded-xl border border-neutral-800 bg-neutral-950/30 p-6">
        <div className="mb-6">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-neutral-500">
            {t("title", { count: subdomains.length })}
          </h3>
        </div>
        <SubdomainsClient
          teamSlug={teamName}
          domainId={domain._id.toString()}
          subdomains={subdomains}
        />
      </div>
    </div>
  );
};

export default SubdomainsPage;
