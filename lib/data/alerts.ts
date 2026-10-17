import dbConnect from "@/lib/mongoose";
import Alert, { type PlatformAlert } from "@/models/Alert";
import Incident, { type IncidentDocument } from "@/models/Incident";

/** Platform alerts shown on the dashboard home (newest first). */
export async function getActiveAlerts(limit = 4): Promise<PlatformAlert[]> {
  await dbConnect();
  return Alert.find({ active: true })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean<PlatformAlert[]>();
}

/** The currently active platform incident, if any. */
export async function getActiveIncident(): Promise<IncidentDocument | null> {
  await dbConnect();
  return Incident.findOne({ active: true })
    .sort({ severity: -1, createdAt: -1 })
    .lean<IncidentDocument>();
}
