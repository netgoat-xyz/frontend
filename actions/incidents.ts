"use server";

import dbConnect from "@/lib/mongoose";
import Incident from "@/models/Incident";
import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";

type IncidentStatus = "investigating" | "identified" | "monitoring" | "resolved";
type IncidentSeverity = "minor" | "major" | "critical";
type IncidentUpdate = Partial<{
  title: string;
  description: string;
  status: IncidentStatus;
  severity: IncidentSeverity;
  active: boolean;
  resolvedAt: Date;
}>;

function serialize<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

const getIncidentsCached = unstable_cache(
  async () => {
    await dbConnect();
    return serialize(await Incident.find().sort({ createdAt: -1 }).lean());
  },
  ["incidents-list"],
  { revalidate: 30, tags: ["incidents"] },
);

export async function getIncidents() {
  return getIncidentsCached();
}

export async function createIncident(data: {
  title: string;
  description: string;
  status: string;
  severity: string;
}) {
  await dbConnect();
  await Incident.create(data);
  revalidatePath("/status");
  revalidatePath("/admin/incidents");
  revalidateTag("incidents", "max");
  return { success: true };
}

export async function updateIncidentStarted(id: string, data: IncidentUpdate) {
  await dbConnect();
  if (data.status === "resolved") {
    data.active = false;
    data.resolvedAt = new Date();
  }
  await Incident.findByIdAndUpdate(id, data);
  revalidatePath("/status");
  revalidatePath("/admin/incidents");
  revalidateTag("incidents", "max");
  return { success: true };
}

export async function deleteIncident(id: string) {
  await dbConnect();
  await Incident.findByIdAndDelete(id);
  revalidatePath("/status");
  revalidatePath("/admin/incidents");
  revalidateTag("incidents", "max");
  return { success: true };
}
