import mongoose from 'mongoose';
import { installLogHook } from './runtime-logs';

installLogHook();

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error(
    'Please define the MONGODB_URI environment variable inside .env.local'
  );
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
// @ts-expect-error - NodeJS global type extension
let cached = global.mongoose;

if (!cached) {
  // @ts-expect-error - NodeJS global type extension
  cached = global.mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      maxPoolSize: 10,
      minPoolSize: 1,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      family: 4,
    };

    cached.promise = mongoose.connect(MONGODB_URI!, opts).then((mongoose) => {
      return mongoose;
    });
  }
  
  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;

    const message =
      e instanceof Error ? e.message : 'Unknown database connection error';

    // Log full details server-side, but throw a plain serializable error to UI boundaries.
    console.error('MongoDB connection failed:', e);
    throw new Error(
      `Database connection failed. Check MONGODB_URI, Atlas network access, and cluster status. Original error: ${message}`
    );
  }

  return cached.conn;
}

export default dbConnect;
