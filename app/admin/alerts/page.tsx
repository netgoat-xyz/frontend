import type { Metadata } from "next";

import { AlertsManager } from "@/components/admin/alerts-manager";
import { PageHeader } from "@/components/dashboard/page-header";
import { getAllAlerts } from "@/lib/data/alerts";

export const metadata: Metadata = {
  title: "Alerts",
};

export const dynamic = "force-dynamic";

export default async function AdminAlertsPage() {
  const alerts = await getAllAlerts();

  return (
    <>
      <PageHeader
        title="Alerts"
        description="Announcements shown on team dashboards. Alerts can be published immediately, hidden without deleting, and edited in place."
      />
      <AlertsManager alerts={alerts} />
    </>
  );
}
