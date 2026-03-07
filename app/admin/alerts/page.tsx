import { getAllAlerts } from "@/actions/alerts";
import AlertsClient from "./client";

export default async function AlertsPage() {
  const alerts = await getAllAlerts();

  return (
    <>
      <AlertsClient initialAlerts={alerts} />
    </>
  );
}
