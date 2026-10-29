import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/dashboard/page-header";
import {
  CachePolicyForm,
  DangerZone,
  LogLevelForm,
  OriginForm,
} from "@/components/domain/settings-forms";
import { getDomainRoute } from "@/lib/data/domain-detail";
import { toClientDomain } from "@/lib/domain-view";

export const metadata: Metadata = {
  title: "Settings",
};

export default async function DomainSettingsPage({
  params,
}: {
  params: Promise<{ teamName: string; domainName: string }>;
}) {
  const { teamName, domainName } = await params;
  const route = await getDomainRoute(teamName, domainName);
  if (!route) notFound();

  const domain = toClientDomain(route.domain);
  const teamSlug = route.context.team.slug;

  return (
    <>
      <PageHeader
        title="Settings"
        description="Origin, caching and lifecycle for this domain."
      />

      <div className="flex max-w-3xl flex-col gap-6">
        <OriginForm
          teamSlug={teamSlug}
          domainId={domain._id}
          hostname={domain.domain}
          initialOrigin={domain.target_url}
        />
        <CachePolicyForm
          teamSlug={teamSlug}
          domainId={domain._id}
          policy={domain.route_policy}
        />
        <LogLevelForm
          teamSlug={teamSlug}
          domainId={domain._id}
          initial={domain.settings.log_level}
        />
        <DangerZone
          teamSlug={teamSlug}
          domainId={domain._id}
          domainName={domain.domain}
          active={domain.active}
        />
      </div>
    </>
  );
}
