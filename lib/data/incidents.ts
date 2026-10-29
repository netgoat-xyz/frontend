import { cache } from "react";

import dbConnect from "@/lib/mongoose";
import Incident, {
  type IncidentSeverity,
  type IncidentStatus,
} from "@/models/Incident";

export type IncidentView = {
  id: string;
  title: string;
  description: string;
  status: IncidentStatus;
  severity: IncidentSeverity;
  active: boolean;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type RawIncident = {
  _id: unknown;
  title?: string;
  description?: string;
  status?: string;
  severity?: string;
  active?: boolean;
  resolvedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
};

function toIncidentView(incident: RawIncident): IncidentView {
  const status: IncidentStatus =
    incident.status === "identified" ||
    incident.status === "monitoring" ||
    incident.status === "resolved"
      ? incident.status
      : "investigating";

  const severity: IncidentSeverity =
    incident.severity === "major" || incident.severity === "critical"
      ? incident.severity
      : "minor";

  return {
    id: String(incident._id),
    title: incident.title ?? "",
    description: incident.description ?? "",
    status,
    severity,
    active: incident.active !== false,
    resolvedAt: incident.resolvedAt ? incident.resolvedAt.toISOString() : null,
    createdAt: (incident.createdAt ?? new Date(0)).toISOString(),
    updatedAt: (
      incident.updatedAt ??
      incident.createdAt ??
      new Date(0)
    ).toISOString(),
  };
}

const INCIDENT_PROJECTION =
  "title description status severity active resolvedAt createdAt updatedAt";

/** Every incident, newest first, for the admin console. */
export async function listIncidents(): Promise<IncidentView[]> {
  await dbConnect();
  const incidents = await Incident.find({})
    .sort({ createdAt: -1 })
    .select(INCIDENT_PROJECTION)
    .lean<RawIncident[]>();
  return incidents.map(toIncidentView);
}

/** Open incidents — the ones that affect the platform status. */
export const getActiveIncidents = cache(async (): Promise<IncidentView[]> => {
  await dbConnect();
  const incidents = await Incident.find({ active: true })
    .sort({ createdAt: -1 })
    .select(INCIDENT_PROJECTION)
    .lean<RawIncident[]>();
  return incidents.map(toIncidentView);
});

/** Recent history (open and resolved) for the public status page. */
export const getRecentIncidents = cache(async (limit = 10): Promise<IncidentView[]> => {
  await dbConnect();
  const incidents = await Incident.find({})
    .sort({ createdAt: -1 })
    .limit(Math.min(25, Math.max(1, limit)))
    .select(INCIDENT_PROJECTION)
    .lean<RawIncident[]>();
  return incidents.map(toIncidentView);
});

/** The most severe open incident, if any — used for status banners. */
export const getActiveIncident = cache(
  async (): Promise<IncidentView | null> => {
    const active = await getActiveIncidents();
    if (active.length === 0) return null;

    const rank: Record<IncidentSeverity, number> = {
      critical: 0,
      major: 1,
      minor: 2,
    };

    return [...active].sort((a, b) => rank[a.severity] - rank[b.severity])[0] ?? null;
  },
);

/**
 * Overall platform state derived from open incidents, using the same rules
 * the status page followed: a critical incident is an outage, a major one is
 * degraded service.
 */
export function derivePlatformState(
  incidents: IncidentView[],
): "operational" | "degraded" | "outage" {
  const open = incidents.filter((incident) => incident.active);
  if (open.some((incident) => incident.severity === "critical")) return "outage";
  if (open.some((incident) => incident.severity === "major")) return "degraded";
  return "operational";
}
