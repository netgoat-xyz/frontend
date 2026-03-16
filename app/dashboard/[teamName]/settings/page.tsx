import SettingsClient from "@/components/interface/dashboard/settings/client";
import { generateTeamMetadata } from "../metadata"; 

export async function generateMetadata({ params }: { params: any }) {
  return generateTeamMetadata(params, "settings");
}
export default function SettingsPage() {
  return <SettingsClient />;
}