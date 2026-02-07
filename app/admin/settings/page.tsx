import { getGlobalSettings } from "@/actions/adminValues";
import AdminSettingsForm from "@/components/interface/admin/AdminSettingsForm";

export const dynamic = "force-dynamic"; // Ensure settings are fresh

export default async function AdminSettingsPage() {
  let settings;
  try {
     settings = await getGlobalSettings();
  } catch (error) {
     // In case of error (likely auth), we might let the error boundary catch it
     // But strictly speaking, getGlobalSettings throws "Unauthorized" if not admin.
     throw error; 
  }

  return <AdminSettingsForm initialSettings={settings} />;
}
