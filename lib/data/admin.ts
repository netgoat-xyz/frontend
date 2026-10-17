import os from "node:os";

import { cache } from "react";

import dbConnect from "@/lib/mongoose";
import Alert from "@/models/Alert";
import Domain from "@/models/Domain";
import Incident from "@/models/Incident";
import Session from "@/models/Session";
import Team from "@/models/Team";
import User from "@/models/User";

/* -------------------------------------------------------------------------- */
/* Overview                                                                   */
/* -------------------------------------------------------------------------- */

export type AdminOverview = {
  users: number;
  activeSessions: number;
  teams: number;
  activeDomains: number;
  activeAlerts: number;
  openIncidents: number;
  recentUsers: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
    banned: boolean;
    createdAt: string;
  }>;
};

/** Request-scoped platform counters for the admin overview. */
export const getAdminOverview = cache(async (): Promise<AdminOverview> => {
  await dbConnect();

  const [users, activeSessions, teams, activeDomains, activeAlerts, openIncidents, recent] =
    await Promise.all([
      User.countDocuments({}),
      Session.countDocuments({ expiresAt: { $gt: new Date() } }),
      Team.countDocuments({}),
      Domain.countDocuments({ active: true }),
      Alert.countDocuments({ active: true }),
      Incident.countDocuments({ active: true }),
      User.find({})
        .sort({ createdAt: -1 })
        .limit(5)
        .select("name email role banned createdAt")
        .lean<
          Array<{
            _id: unknown;
            name?: string;
            email?: string;
            role?: string;
            banned?: boolean;
            createdAt?: Date;
          }>
        >(),
    ]);

  return {
    users,
    activeSessions,
    teams,
    activeDomains,
    activeAlerts,
    openIncidents,
    recentUsers: recent.map((user) => ({
      id: String(user._id),
      name: user.name ?? "Unnamed",
      email: user.email ?? "",
      role: user.role ?? "user",
      banned: Boolean(user.banned),
      createdAt: (user.createdAt ?? new Date(0)).toISOString(),
    })),
  };
});

/* -------------------------------------------------------------------------- */
/* System specs                                                               */
/* -------------------------------------------------------------------------- */

export type SystemSpecs = {
  os: string;
  platform: string;
  arch: string;
  cpuModel: string;
  cpuCount: number;
  memoryTotalGb: number;
  memoryFreeGb: number;
  uptimeHours: number;
  loadAverage: [number, number, number];
  nodeVersion: string;
  pid: number;
};

/** Host machine details, read from the Node runtime on demand. */
export function getSystemSpecs(): SystemSpecs {
  const cpus = os.cpus();
  const [one = 0, five = 0, fifteen = 0] = os.loadavg();

  return {
    os: `${os.type()} ${os.release()}`,
    platform: os.platform(),
    arch: os.arch(),
    cpuModel: cpus[0]?.model?.trim() ?? "Unknown CPU",
    cpuCount: cpus.length,
    memoryTotalGb: Number((os.totalmem() / 1024 ** 3).toFixed(2)),
    memoryFreeGb: Number((os.freemem() / 1024 ** 3).toFixed(2)),
    uptimeHours: Number((os.uptime() / 3600).toFixed(1)),
    loadAverage: [one, five, fifteen],
    nodeVersion: process.version,
    pid: process.pid,
  };
}

/* -------------------------------------------------------------------------- */
/* Database stats                                                             */
/* -------------------------------------------------------------------------- */

export type DatabaseStats = {
  collections: Array<{ name: string; documents: number }>;
  databaseName: string;
  sizeOnDiskMb: number | null;
};

/** Nearest-accurate database footprint used by the system page. */
export async function getDatabaseStats(): Promise<DatabaseStats> {
  const connection = await dbConnect();
  const db = connection.connection.db;
  if (!db) {
    return { collections: [], databaseName: "unknown", sizeOnDiskMb: null };
  }

  const [collections, stats] = await Promise.all([
    db.listCollections().toArray(),
    db.stats().catch(() => null),
  ]);

  const counts = await Promise.all(
    collections.map(async (info) => ({
      name: info.name,
      documents: await db
        .collection(info.name)
        .estimatedDocumentCount()
        .catch(() => 0),
    })),
  );

  return {
    collections: counts.sort((a, b) => b.documents - a.documents),
    databaseName: db.databaseName,
    sizeOnDiskMb: stats
      ? Number((stats.dataSize / 1024 ** 2).toFixed(1))
      : null,
  };
}
