import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/dashboard/page-header";
import { SslForm } from "@/components/domain/ssl-form";
import { getSubdomainRoute } from "@/lib/data/domain-detail";

export const metadata: Metadata = {
  title: "Subdomain SSL",
};

export default async function SubdomainSslPage({
  params,
}: {
  params: Promise<{ teamName: string; domainName: string; subdomain: string }>;
}) {
  const { teamName, domainName, subdomain: subdomainLabel } = await params;
  const route = await getSubdomainRoute(teamName, domainName, subdomainLabel);
  if (!route) notFound();

  const { subdomain } = route;

  return (
    <>
      <PageHeader
        title="SSL/TLS"
        description={`Certificates for ${subdomain.full_domain}. Without a manual certificate the hostname uses the domain configuration.`}
      />
      <SslForm
        teamSlug={route.context.team.slug}
        domainId={String(route.domain._id)}
        subdomain={subdomain.subdomain}
        hostname={subdomain.full_domain}
        autoSsl={Boolean(route.domain.auto_ssl)}
        hasManualCertificate={Boolean(subdomain.certificate_pem)}
        sslEnabled={Boolean(subdomain.certificate_pem)}
      />
    </>
  );
}
