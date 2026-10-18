import type { Metadata } from "next";

import { IncidentsManager } from "@/components/admin/incidents-manager";
import { PageHeader } from "@/components/dashboard/page-header";
import { listIncidents } from "@/lib/data/incidents";

export const metadata: Metadata = {
  title: "Incidents",
};

export const dynamic = "force-dynamic";

export default async function AdminIncidentsPage() {
  const incidents = await listIncidents();

  return (
    <>
      <PageHeader
        title="Incidents"
        description="Open and past incidents. Resolving an incident records the time and updates platform status on the public page."
      />
      <IncidentsManager incidents={incidents} />
    </>
  );
}
