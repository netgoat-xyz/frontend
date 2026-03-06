import IntegrationClient from "@/components/interface/dashboard/integrations/client";
import { generateTeamMetadata } from "../metadata"; 

export async function generateMetadata({ params }: { params: any }) {
  return generateTeamMetadata(params, "Integrations");
}

export default function IntegrationsPage() {
  return <IntegrationClient />;
}