import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/dashboard/page-header";
import { WafManager } from "@/components/domain/waf-manager";
import { getSubdomainRoute } from "@/lib/data/domain-detail";
import { toClientDomain } from "@/lib/domain-view";

export const metadata: Metadata = {
  title: "Subdomain WAF",
};

export default async function SubdomainWafPage({
  params,
}: {
  params: Promise<{ teamName: string; domainName: string; subdomain: string }>;
}) {
  const { teamName, domainName, subdomain: subdomainLabel } = await params;
  const route = await getSubdomainRoute(teamName, domainName, subdomainLabel);
  if (!route) notFound();

  const domain = toClientDomain(route.domain);
  const subdomain = domain.subdomains.find(
    (entry) => entry.subdomain === route.subdomain.subdomain,
  );

  return (
    <>
      <PageHeader
        title="WAF rules"
        description={`Rules that apply to ${route.subdomain.full_domain} before the shared domain rules.`}
      />
      <WafManager
        teamSlug={route.context.team.slug}
        domainId={domain._id}
        subdomain={route.subdomain.subdomain}
        rules={subdomain?.wafRules ?? []}
        hostname={route.subdomain.full_domain}
      />
    </>
  );
}
