"use server";

import dbConnect from "@/lib/mongoose";
import User from "@/models/User";
import Session from "@/models/Session";
import Settings from "@/models/Settings";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import os from "os";

// Helper to check admin permission
export async function checkAdmin() {
  const session = await auth.api.getSession({
    headers: await headers()
  });
  if (!session || session.user.role !== "admin") {
    throw new Error("Unauthorized");
  }
}

export async function getAdminStats() {
  await checkAdmin();
  await dbConnect();

  const totalUsers = await User.countDocuments();
  const activeSessions = await Session.countDocuments({
    expiresAt: { $gt: new Date() }
  });
  
  const systemLoad = os.loadavg()[0].toFixed(2);
  const securityEvents = 0; // Placeholder

  return {
    totalUsers,
    activeSessions,
    systemLoad: `${systemLoad} (1m avg)`,
    securityEvents
  };
}

export async function getGlobalSettings() {
  await checkAdmin();
  const settings = await getPublicSettings();
  return settings;
}

export async function getPublicSettings() {
  await dbConnect();

  let settings = await Settings.findOne();
  if (!settings) {
    settings = await Settings.create({
      siteName: "NetGoat",
      registrationEnabled: true
    });
  }

  // Convert to POJO to avoid serialization issues with Mongoose docs
  return JSON.parse(JSON.stringify(settings));
}

export async function updateGlobalSettings(newSettings: any) {
  await checkAdmin();
  await dbConnect();

  // Strip system fields
  const { _id, __v, ...updateData } = newSettings;

  const settings = await Settings.findOneAndUpdate(
    {}, // find the first one
    { $set: updateData },
    { new: true, upsert: true }
  );

  return JSON.parse(JSON.stringify(settings));
}

export async function getUsers(page = 1, limit = 10, search = "") {
  await checkAdmin();
  await dbConnect();

  const query: any = {};
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { _id: { $regex: search, $options: "i" } }, // Use _id for Mongoose
    ];
  }

  const skip = (page - 1) * limit;
  const users = await User.find(query).skip(skip).limit(limit).sort({ createdAt: -1 });
  const total = await User.countDocuments(query);

  return {
    users: JSON.parse(JSON.stringify(users)),
    total,
    pages: Math.ceil(total / limit)
  };
}

export async function updateUser(userId: string, data: any) {
  await checkAdmin();
  await dbConnect();

  const existingUser = await User.findById(userId);
  if (!existingUser) throw new Error("User not found");

  if (data.password) {
     delete data.password;
     console.warn("Password change requested but not fully implemented in direct DB mode via this action");
  }

  const updatedUser = await User.findByIdAndUpdate(userId, { $set: data }, { new: true });
  return JSON.parse(JSON.stringify(updatedUser));
}

export async function getSystemSpecs() {
  await checkAdmin();
  
  const cpus = os.cpus();
  const memory = {
    total: os.totalmem(),
    free: os.freemem(),
  };
  const uptime = os.uptime();
  const platform = os.platform();
  const type = os.type();

  return {
    cpuModel: cpus[0]?.model || "Unknown",
    cpuCount: cpus.length,
    memoryTotal: (memory.total / 1024 / 1024 / 1024).toFixed(2) + " GB",
    memoryFree: (memory.free / 1024 / 1024 / 1024).toFixed(2) + " GB",
    uptime: (uptime / 3600).toFixed(1) + " Hours",
    os: `${type} ${platform}`,
  };
}

import { getRuntimeLogs } from "@/lib/runtime-logs";

export async function adminRestartSystem() {
  await checkAdmin();
  console.log("System restart triggered by Admin");
  // Implement actual restart logic here if running in a manageable environment (different per host)
  return { success: true, message: "Restart signal sent (Simulation)" };
}

export async function getServerLogs() {
  await checkAdmin();
  const logs = getRuntimeLogs(200);
  return JSON.parse(JSON.stringify(logs)); // Serialization safety
}
