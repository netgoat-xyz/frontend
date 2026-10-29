import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { NewDomainForm } from "@/components/dashboard/new-domain-form";
import { PageHeader } from "@/components/dashboard/page-header";
import { getTeamContext } from "@/lib/auth-guards";

export const metadata: Metadata = {
  title: "Add a domain",
};

export default async function NewDomainPage({
  params,
}: {
  params: Promise<{ teamName: string }>;
}) {
  const { teamName } = await params;
  const { team } = await getTeamContext(teamName);
  if (!team) notFound();

  return (
    <>
      <PageHeader
        title="Add a domain"
        description="Connect a hostname to an origin — verification happens in one DNS record."
      />
      <NewDomainForm teamSlug={team.slug} />
    </>
  );
}
