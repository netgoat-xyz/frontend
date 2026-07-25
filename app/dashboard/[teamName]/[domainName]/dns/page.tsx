import { HeaderSection } from "@/components/interface/domains/overview/HeaderSection";
import { DnsRecords } from "@/components/interface/domains/dns/DnsRecords";
import { loadDomainByRoute } from "../_lib/domain-data";
import { getTranslations } from "next-intl/server";

type Props = {
  params: {
    teamName: string
    domainName: string
  }
}

const DnsPage = async ({ params }: Props) => {
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

  type DnsRecord = {
    _id?: string
    type: string
    name: string
    value: string
    ttl?: string | number
    proxied?: boolean
  }

  const dnsRecords: DnsRecord[] = (domain.dns_records || []).map((record: DnsRecord) => ({
    _id: record._id,
    type: record.type,
    name: record.name,
    value: record.value,
    ttl: record.ttl,
    proxied: record.proxied
  }))

  return (
    <div className="space-y-6">
      <HeaderSection domainData={domainData} />
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2">
          <DnsRecords records={dnsRecords} />
        </div>
      </div>
    </div>
  );
};

export default DnsPage;
