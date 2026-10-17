import type { Metadata } from "next";
import Link from "next/link";

import { CreateTeamForm } from "@/components/dashboard/create-team-form";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth-guards";

export const metadata: Metadata = {
  title: "Create a team",
};

export default async function NewTeamPage() {
  await requireUser();

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-10">
      <PageHeader
        title="Create a team"
        description="Teams keep domains, members and billing separate from each other."
      >
        <Button variant="ghost" render={<Link href="/dashboard/teams" />}>
          Back to teams
        </Button>
      </PageHeader>
      <CreateTeamForm />
    </div>
  );
}
