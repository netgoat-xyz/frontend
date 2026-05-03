// Updated auth.ts with new email templates
import { betterAuth, APIError } from "better-auth";
import { dash } from "@better-auth/infra";
import { admin, emailOTP, magicLink } from "better-auth/plugins";
import { MongoClient } from "mongodb";
import { Resend } from "resend";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import dbConnect from "@/lib/mongoose";
import Settings from "@/models/Settings";

const mongoUri = process.env.MONGODB_URI;
if (!mongoUri) {
  throw new Error("MONGODB_URI is required for auth database.");
}

type GlobalWithAuthMongo = typeof globalThis & {
  _authMongoClient?: MongoClient;
  _authMongoConnectPromise?: Promise<MongoClient>;
};

const globalWithAuthMongo = globalThis as GlobalWithAuthMongo;

const client =
  globalWithAuthMongo._authMongoClient ??
  new MongoClient(mongoUri, {
    tls: true,
    tlsAllowInvalidCertificates: true,
    tlsAllowInvalidHostnames: true,
    maxPoolSize: 20,
    minPoolSize: 1,
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
    family: 4,
  });

if (!globalWithAuthMongo._authMongoClient) {
  globalWithAuthMongo._authMongoClient = client;
  globalWithAuthMongo._authMongoConnectPromise = client
    .connect()
    .then(() => client);
}

void (
  globalWithAuthMongo._authMongoConnectPromise ?? client.connect().then(() => client)
).catch((error) => {
  console.error("Auth MongoDB preconnect failed:", error);
});

const db = client.db();
const resendApiKey = process.env.RESEND_APIKEY;
if (!resendApiKey) {
  throw new Error("RESEND_APIKEY is required for magic link and OTP emails.");
}
const resend = new Resend(resendApiKey);
const emailFrom = process.env.EMAIL_FROM ?? "noreply@netgoat.xyz";
const appName = "Netgoat";

export const auth = betterAuth({
  database: mongodbAdapter(db, { client }),
  ipAddressHeaders: ["cf-connecting-ip", "x-forwarded-for", "x-vercel-forwarded-for", "x-real-ip", "x-netgoat-cip"],
  experimental: {
    joins: true,
  },
  trustedOrigins: [process.env.NEXT_PUBLIC_SITE_URL as string],
  logger: {
    level: process.env.NODE_ENV === "development" ? "warn" : "error",
  },
  plugins: [
        dash(),
    admin(),
    magicLink({
      storeToken: "hashed",
      sendMagicLink: async ({ email, url }) => {
        const { renderMagicLinkEmail } = await import("@/lib/email");
        const html = await renderMagicLinkEmail(url, appName);

        await resend.emails.send({
          from: `${appName} <${emailFrom}>`,
          to: email,
          subject: `Sign in to ${appName}`,
          html,
          text: `Sign in to ${appName}: ${url}`,
        });
      },
    }),
    emailOTP({
      storeOTP: "hashed",
      overrideDefaultEmailVerification: true,
      sendVerificationOnSignUp: true,
      sendVerificationOTP: async ({ email, otp, type }) => {
        const { renderOTPEmail } = await import("@/lib/email");
        const html = await renderOTPEmail(otp, type, appName);

        const typeLabel =
          type === "email-verification"
            ? "Verify your email"
            : type === "forget-password"
              ? "Reset your password"
              : "Sign in code";

        await resend.emails.send({
          from: `${appName} <${emailFrom}>`,
          to: email,
          subject: `${typeLabel} - ${appName}`,
          html,
          text: `Your ${typeLabel.toLowerCase()} for ${appName} is: ${otp}`,
        });
      },
    }),
  ],
  hooks: {
    before: async (ctx) => {
      const reqUrl = ctx.request?.url;
      if (reqUrl?.includes("/sign-up/email")) {
        await dbConnect();
        const settings = await Settings.findOne();

        if (settings && settings.registrationEnabled === false) {
          throw new APIError("BAD_REQUEST", {
            message: "Registration is currently disabled.",
          });
        }
      }
    },
    after: async (ctx) => {
      const reqUrl = ctx.request?.url;
      if (reqUrl?.includes("/sign-up/email")) {
        setImmediate(async () => {
          try {
            const mongoose = (await import("mongoose")).default;
            const { Team } = await import("@/models/Team");

            await dbConnect();
            const users = await db
              .collection("user")
              .find()
              .sort({ _id: -1 })
              .limit(1)
              .toArray();
            const user = users[0];

            if (!user) return;

            const rawUserId = user?._id ?? user?.id;
            if (!rawUserId) return;
            const userId = mongoose.isValidObjectId(rawUserId)
              ? new mongoose.Types.ObjectId(rawUserId)
              : null;
            if (!userId) return;
            const userEmail = user.email;
            const userName = user.name || userEmail?.split("@")[0] || "User";

            const personalSlug = `@me-${userId}`;

            const existingTeam = await Team.findOne({
              slug: personalSlug,
            });

            if (!existingTeam) {
              await Team.create({
                name: `${userName}'s Personal Team`,
                slug: personalSlug,
                description: "Your personal team",
                members: [
                  {
                    user_id: userId,
                    role: "owner",
                    joined_at: new Date(),
                  },
                ],
                active: true,
              });

              console.log(
                `Created personal team ${personalSlug} for user ${userId}`,
              );
            }
          } catch (error) {
            console.error("Failed to create personal team:", error);
          }
        });
      }

      return ctx;
    },
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
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
  appName: "NetGoat",
});
