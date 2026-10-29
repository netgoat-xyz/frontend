import { cache } from "react";

import dbConnect from "@/lib/mongoose";
import Alert, { type PlatformAlert } from "@/models/Alert";

export type AlertView = {
  id: string;
  title: string;
  body: string;
  variant: "red" | "yellow" | "blue";
  actionText: string;
  active: boolean;
  createdAt: string;
};

type RawAlert = {
  _id: unknown;
  title?: string;
  body?: string;
  variant?: string;
  actionText?: string;
  active?: boolean;
  createdAt?: Date;
};

function toAlertView(alert: RawAlert & { _id: unknown }): AlertView {
  return {
    id: String(alert._id),
    title: alert.title ?? "",
    body: alert.body ?? "",
    variant:
      alert.variant === "red" || alert.variant === "yellow"
        ? alert.variant
        : "blue",
    actionText: alert.actionText ?? "Dismiss",
    active: Boolean(alert.active),
    createdAt: (alert.createdAt ?? new Date(0)).toISOString(),
  };
}

/** Active alerts for the dashboard banner strip. */
export const getActiveAlerts = cache(async (): Promise<AlertView[]> => {
  await dbConnect();
  const alerts = await Alert.find({ active: true })
    .sort({ createdAt: -1 })
    .select("title body variant actionText active createdAt")
    .lean<RawAlert[]>();
  return alerts.map(toAlertView);
});

/** Every alert, newest first, for the admin console. */
export async function getAllAlerts(): Promise<AlertView[]> {
  await dbConnect();
  const alerts = await Alert.find({})
    .sort({ createdAt: -1 })
    .select("title body variant actionText active createdAt")
    .lean<RawAlert[]>();
  return alerts.map(toAlertView);
}

export type { PlatformAlert };
