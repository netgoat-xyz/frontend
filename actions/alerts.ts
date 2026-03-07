"use server";

import dbConnect from "@/lib/mongoose";
import Alert from "@/models/Alert";
import { revalidatePath } from "next/cache";

export async function getActiveAlerts() {
  await dbConnect();
  const alerts = await Alert.find({ active: true }).sort({ createdAt: -1 }).lean();
  return JSON.parse(JSON.stringify(alerts));
}

export async function getAllAlerts() {
  await dbConnect();
  const alerts = await Alert.find().sort({ createdAt: -1 }).lean();
  return JSON.parse(JSON.stringify(alerts));
}

export async function createAlert(data: {
  title: string;
  body: string;
  variant: string;
  actionText: string;
}) {
  await dbConnect();
  await Alert.create({ ...data, active: true });
  // Need to invalidate dashboard paths
  revalidatePath("/", "layout");
  return { success: true };
}

export async function toggleAlertActive(id: string, active: boolean) {
  await dbConnect();
  await Alert.findByIdAndUpdate(id, { active });
  revalidatePath("/", "layout");
  return { success: true };
}

export async function deleteAlert(id: string) {
  await dbConnect();
  await Alert.findByIdAndDelete(id);
  revalidatePath("/", "layout");
  return { success: true };
}
