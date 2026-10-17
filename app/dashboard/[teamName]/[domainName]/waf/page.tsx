import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/dashboard/page-header";
import { WafManager } from "@/components/domain/waf-manager";
import { getDomainRoute } from "@/lib/data/domain-detail";
import { toClientDomain } from "@/lib/domain-view";

export const metadata: Metadata = {
  title: "WAF",
};

export default async function DomainWafPage({
  params,
}: {
  params: Promise<{ teamName: string; domainName: string }>;
}) {
  const { teamName, domainName } = await params;
  const route = await getDomainRoute(teamName, domainName);
  if (!route) notFound();

  const domain = toClientDomain(route.domain);

  return (
    <>
      <PageHeader
        title="Web application firewall"
        description="Inspect requests at the edge and block, allow or log them before they reach the origin."
      />
      <WafManager
        teamSlug={route.context.team.slug}
        domainId={domain._id}
        rules={domain.wafRules}
        hostname={domain.domain}
      />
    </>
  );
}
