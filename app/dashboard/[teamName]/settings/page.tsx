import SettingsClient from "@/components/interface/dashboard/settings/client";
import { generateTeamMetadata, type TeamMetadataParams } from "../metadata";

export async function generateMetadata({ params }: { params: TeamMetadataParams }) {
  return generateTeamMetadata(params, "settings");
}
export default function SettingsPage() {
  return <SettingsClient />;
}
