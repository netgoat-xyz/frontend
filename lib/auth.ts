import { betterAuth, APIError } from "better-auth";
import { MongoClient } from "mongodb";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import dbConnect from "@/lib/mongoose";
import Settings from "@/models/Settings";

const client = new MongoClient(process.env.MONGODB_URI!);
const db = client.db();

export const auth = betterAuth({
  database: mongodbAdapter(db, { client }),
  trustedOrigins: [process.env.NEXT_PUBLIC_SITE_URL as string],
  logger: {
    level: "debug",
  },
  hooks: {
    before: async (ctx) => {
      const reqUrl = ctx.request?.url;
      if (reqUrl?.includes("/sign-up/email")) {
        await dbConnect();
        const settings = await Settings.findOne();
        
        if (settings && settings.registrationEnabled === false) {
           throw new APIError("BAD_REQUEST", { 
             message: "Registration is currently disabled." 
           });
        }
      }
    },
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "user",
        input: false,
      },
      banned: {
        type: "boolean",
        required: false,
        defaultValue: false,
        input: false,
      },
    },
    changeEmail: {
      enabled: true,
    },
  },
  socialProviders: {
    discord: {
      clientId: process.env.DISCORD_CLIENT_ID as string,
      clientSecret: process.env.DISCORD_CLIENT_SECRET as string,
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID as string,
      clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
    },
    gitlab: {
      clientId: process.env.GITLAB_CLIENT_ID as string,
      clientSecret: process.env.GITLAB_CLIENT_SECRET as string,
    },
  },
});