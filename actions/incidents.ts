"use server";

import dbConnect from "@/lib/mongoose";
import Incident from "@/models/Incident";
import { revalidatePath } from "next/cache";

export async function getIncidents() {
  await dbConnect();
  const incidents = await Incident.find().sort({ createdAt: -1 }).lean();
  return JSON.parse(JSON.stringify(incidents));
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
  return { success: true };
}

export async function updateIncidentStarted(id: string, data: any) {
  await dbConnect();
  if (data.status === "resolved") {
    data.active = false;
    data.resolvedAt = new Date();
  }
  await Incident.findByIdAndUpdate(id, data);
  revalidatePath("/status");
  revalidatePath("/admin/incidents");
  return { success: true };
}

export async function deleteIncident(id: string) {
  await dbConnect();
  await Incident.findByIdAndDelete(id);
  revalidatePath("/status");
  revalidatePath("/admin/incidents");
  return { success: true };
}
