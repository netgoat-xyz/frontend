import { betterAuth } from "better-auth";
import { MongoClient } from "mongodb";
import { mongodbAdapter } from "better-auth/adapters/mongodb";

const client = new MongoClient(process.env.MONGODB_URI!);
const db = client.db();

export const auth = betterAuth({
  database: mongodbAdapter(db, { client }),
  logger: {
    level: "debug",
  },
  emailAndPassword: { 
    enabled: true,
    requireEmailVerification: false, // Disable email verification
  },
});
