import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { DNSManager } from "@/components/domain/dns-manager";
import { PageHeader } from "@/components/dashboard/page-header";
import { getDomainRoute } from "@/lib/data/domain-detail";
import { listDomainDNSRecords } from "@/lib/data/dns";
import { toClientDNSRecord, toClientDomain } from "@/lib/domain-view";

export const metadata: Metadata = {
  title: "DNS",
};

export default async function DomainDNSPage({
  params,
}: {
  params: Promise<{ teamName: string; domainName: string }>;
}) {
  const { teamName, domainName } = await params;
  const route = await getDomainRoute(teamName, domainName);
  if (!route) notFound();
  if (route.domain.dns_enabled === false) notFound();

  const domain = toClientDomain(route.domain);
  const records = await listDomainDNSRecords(
    String(route.context.team._id),
    domain._id,
  );

  return (
    <>
      <PageHeader
        title="DNS records"
        description="Records the edge answers for this domain."
      />
      <DNSManager
        teamSlug={route.context.team.slug}
        domainId={domain._id}
        domainName={domain.domain}
        records={records.map(toClientDNSRecord)}
      />
    </>
  );
}
