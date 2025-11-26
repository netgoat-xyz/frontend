import mongoose from "mongoose";

import { verifySession } from "@/lib/session";
import User from "@/models/User";

// Ensure MongoDB connection
async function connectDB() {
  if ((global as any).mongoose?.connection?.readyState === 1) return;

  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI environment variable is not set");
  }

  await mongoose.connect(process.env.MONGODB_URI);
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return new Response("Authorization header is required", { status: 400 });
  }

  const session = authHeader.split(" ")[1];
  try {
    const payload = await verifySession(session);
    if (!payload) {
      return new Response("Invalid session token", { status: 401 });
    }

    // Connect to MongoDB
    await connectDB();

    const userId = (payload as any).userId;
    if (!userId) {
      return new Response("User ID not found in token", { status: 401 });
    }

    // Fetch fresh user data from MongoDB
    const user: any = await User.findById(userId).lean();
    if (!user) {
      return new Response("User not found", { status: 404 });
    }

    // Return sanitized user data (no password or sensitive fields)
    const sanitizedUser = {
      _id: user._id,
      username: user.username,
      avatar: user.avatar,
      email: user.email,
      role: user.role,
      domains: user.domains || [],
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      // Include integration connection status only (no secrets)
      integrations: user.integrations
        ? {
            twofa: user.integrations.twofa
              ? {
                  enabled: user.integrations.twofa.enabled,
                  method: user.integrations.twofa.method,
                }
              : null,
            cloudflare:
              user.integrations.cloudflare &&
              Object.keys(user.integrations.cloudflare).length > 0
                ? { connected: true }
                : null,
            google:
              user.integrations.google &&
              Object.keys(user.integrations.google).length > 0
                ? { connected: true }
                : null,
            discord:
              user.integrations.discord &&
              Object.keys(user.integrations.discord).length > 0
                ? { connected: true }
                : null,
            github:
              user.integrations.github &&
              Object.keys(user.integrations.github).length > 0
                ? { connected: true }
                : null,
            microsoft:
              user.integrations.microsoft &&
              Object.keys(user.integrations.microsoft).length > 0
                ? { connected: true }
                : null,
          }
        : null,
    };

    return new Response(JSON.stringify(sanitizedUser), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Session verification failed:", error);
    return new Response("Internal server error", { status: 500 });
  }
}
