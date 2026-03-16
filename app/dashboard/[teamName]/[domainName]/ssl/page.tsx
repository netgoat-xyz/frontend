import { HeaderSection } from "@/components/interface/domains/overview/HeaderSection";
import { SslCertificate } from "@/components/interface/domains/ssl/SslCertificate";
import { SslHealthCheck } from "@/components/interface/domains/ssl/SslHealthCheck";
import { loadDomainByRoute } from "../_lib/domain-data";
import { getTranslations } from "next-intl/server";

type Props = {
  params: {
    teamName: string
    domainName: string
  } | Promise<{ teamName: string, domainName: string }>
}

const SslPage = async ({ params }: Props) => {
  const { teamName, domainName, domain, domainData } = await loadDomainByRoute(params)
  const t = await getTranslations("DashboardPages.domain")

  if (!domain || !domainData) {
    return (
      <div className="min-h-svh p-4 sm:p-6 lg:p-8">
        <h2 className="text-2xl font-semibold">{t("notFound.title")}</h2>
        <p className="text-muted">{t("notFound.description", { domainName, teamName })}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <HeaderSection domainData={domainData} />
      <SslCertificate domain={domain} />
      <SslHealthCheck domain={domain} />
    </div>
  );
};

export default SslPage;
