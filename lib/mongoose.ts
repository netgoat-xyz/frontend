import mongoose from "mongoose";
import { serverEnv } from "@/lib/env";

type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

// A global cache keeps a single connection across hot reloads in development
// and across concurrent serverless invocations in production.
const globalForMongoose = globalThis as typeof globalThis & {
  __netgoatMongoose?: MongooseCache;
};

const cache: MongooseCache = (globalForMongoose.__netgoatMongoose ??= {
  conn: null,
  promise: null,
});

/**
 * Connects to MongoDB (idempotent) and returns the shared mongoose instance.
 */
export async function dbConnect(): Promise<typeof mongoose> {
  if (cache.conn) return cache.conn;

  if (!cache.promise) {
    cache.promise = mongoose.connect(serverEnv().MONGODB_URI, {
      bufferCommands: false,
      maxPoolSize: 10,
      minPoolSize: 1,
      serverSelectionTimeoutMS: 10_000,
      socketTimeoutMS: 45_000,
      family: 4,
    });
  }

  try {
    cache.conn = await cache.promise;
  } catch (error) {
    // Reset so the next call retries instead of reusing a rejected promise.
    cache.promise = null;
    const message =
      error instanceof Error ? error.message : "Unknown database connection error";
    console.error("MongoDB connection failed:", error);
    throw new Error(
      `Database connection failed. Check MONGODB_URI and cluster availability. (${message})`,
    );
  }

  return cache.conn;
}

export default dbConnect;
