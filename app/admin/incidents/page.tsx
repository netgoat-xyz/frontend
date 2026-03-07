import { getIncidents } from "@/actions/incidents";
import IncidentsClient from "./client";

export default async function IncidentsPage() {
  const incidents = await getIncidents();

  return (
    <>
      <IncidentsClient initialIncidents={incidents} />
    </>
  );
}
