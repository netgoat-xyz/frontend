import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/dashboard/page-header";
import { SslForm } from "@/components/domain/ssl-form";
import { getDomainRoute } from "@/lib/data/domain-detail";
import { toClientDomain } from "@/lib/domain-view";

export const metadata: Metadata = {
  title: "SSL/TLS",
};

export default async function DomainSslPage({
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
        title="SSL/TLS"
        description="Serve HTTPS with automatic certificates or your own PEM material."
      />
      <SslForm
        teamSlug={route.context.team.slug}
        domainId={domain._id}
        hostname={domain.domain}
        autoSsl={domain.auto_ssl}
        hasManualCertificate={domain.hasManualCertificate}
        sslEnabled={domain.ssl_enabled}
      />
    </>
  );
}
