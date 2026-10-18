import type { Metadata } from "next";

import { SettingsForm } from "@/components/admin/settings-form";
import { PageHeader } from "@/components/dashboard/page-header";
import { getAdminSettings } from "@/lib/data/settings";

export const metadata: Metadata = {
  title: "Settings",
};

// Always read the live document: settings change rarely but must never be
// served from a build-time snapshot.
export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const settings = await getAdminSettings();

  return (
    <>
      <PageHeader
        title="Settings"
        description="Platform-wide configuration. Every field is validated server-side before it is written to the settings document."
      />
      <SettingsForm initialSettings={settings} />
    </>
  );
}
