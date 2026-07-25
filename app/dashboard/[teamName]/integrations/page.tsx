import IntegrationClient from "@/components/interface/dashboard/integrations/client";
import { generateTeamMetadata, type TeamMetadataParams } from "../metadata";

export async function generateMetadata({ params }: { params: TeamMetadataParams }) {
  return generateTeamMetadata(params, "integrations");
}

export default function IntegrationsPage() {
  return <IntegrationClient />;
}
