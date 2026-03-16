import TeamsOverview from "@/components/interface/teams/client";
import { generateTeamMetadata } from "./metadata"; 

export async function generateMetadata({ params }: { params: any }) {
  return generateTeamMetadata(params, "overview");
}
export default function TeamsPage() {
  return <TeamsOverview />;
}