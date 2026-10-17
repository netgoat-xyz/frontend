import { APIError, betterAuth } from "better-auth";
import { dash } from "@better-auth/infra";
import { admin, emailOTP, magicLink } from "better-auth/plugins";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { MongoClient } from "mongodb";

import { serverEnv } from "@/lib/env";
import { APP_NAME, sendEmail } from "@/lib/email";
import { magicLinkEmail, otpEmail } from "@/lib/email/templates";
import dbConnect from "@/lib/mongoose";
import Settings from "@/models/Settings";
import { ensurePersonalTeam } from "@/lib/teams";

const env = serverEnv();

/* -------------------------------------------------------------------------- */
/* MongoDB connection (owned by better-auth, separate pool from mongoose)     */
/* -------------------------------------------------------------------------- */

type AuthMongoGlobal = typeof globalThis & {
  __netgoatAuthMongo?: { client: MongoClient; ready: Promise<MongoClient> };
};

const globalForAuth = globalThis as AuthMongoGlobal;

const authMongo =
  globalForAuth.__netgoatAuthMongo ??
  (() => {
    const client = new MongoClient(env.MONGODB_URI, {
      maxPoolSize: 20,
      minPoolSize: 1,
      serverSelectionTimeoutMS: 10_000,
      socketTimeoutMS: 45_000,
      family: 4,
    });
    return { client, ready: client.connect().then(() => client) };
  })();

if (!globalForAuth.__netgoatAuthMongo) {
  globalForAuth.__netgoatAuthMongo = authMongo;
  void authMongo.ready.catch((error) => {
    console.error("[auth] MongoDB preconnect failed:", error);
  });
}

const db = authMongo.client.db();

/* -------------------------------------------------------------------------- */
/* Trusted origins                                                            */
/* -------------------------------------------------------------------------- */

const trustedOrigins = Array.from(
  new Set(
    [
      env.NEXT_PUBLIC_SITE_URL,
      env.BETTER_AUTH_URL,
      // Local development ports (frontend on 3000, v2 on 3002, misc).
      ...(env.NODE_ENV !== "production"
        ? ["http://localhost:3000", "http://localhost:3002", "http://127.0.0.1:3002"]
        : []),
    ].filter((value): value is string => Boolean(value)),
  ),
);

/* -------------------------------------------------------------------------- */
/* Auth instance                                                              */
/* -------------------------------------------------------------------------- */

const socialProviders = {
  ...(env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET
    ? {
        github: {
          clientId: env.GITHUB_CLIENT_ID,
          clientSecret: env.GITHUB_CLIENT_SECRET,
        },
      }
    : {}),
  ...(env.GITLAB_CLIENT_ID && env.GITLAB_CLIENT_SECRET
    ? {
        gitlab: {
          clientId: env.GITLAB_CLIENT_ID,
          clientSecret: env.GITLAB_CLIENT_SECRET,
        },
      }
    : {}),
  ...(env.DISCORD_CLIENT_ID && env.DISCORD_CLIENT_SECRET
    ? {
        discord: {
          clientId: env.DISCORD_CLIENT_ID,
          clientSecret: env.DISCORD_CLIENT_SECRET,
        },
      }
    : {}),
};

export const auth = betterAuth({
  appName: APP_NAME,
  database: mongodbAdapter(db, { client: authMongo.client }),
  experimental: {
    joins: true,
  },
  trustedOrigins,
  logger: {
    level: env.NODE_ENV === "development" ? "warn" : "error",
  },

  advanced: {
    // Prefer edge/proxy-provided client IP headers before falling back.
    ipAddress: {
      ipAddressHeaders: [
        "cf-connecting-ip",
        "x-netgoat-cip",
        "x-vercel-forwarded-for",
        "x-forwarded-for",
        "x-real-ip",
      ],
    },
  },

  rateLimit: {
    enabled: true,
    window: 60,
    max: 100,
    // Tighten the rules on credential endpoints and outbound email senders.
    customRules: {
      "/sign-in/email": { window: 60, max: 8 },
      "/sign-up/email": { window: 600, max: 5 },
      "/sign-in/magic-link": { window: 300, max: 3 },
      "/sign-in/social": { window: 300, max: 20 },
      "/email-otp/send-verification-otp": { window: 300, max: 3 },
      "/email-otp/verify-email": { window: 300, max: 10 },
      "/forget-password/email-otp": { window: 300, max: 3 },
      "/reset-password": { window: 300, max: 5 },
    },
  },

  plugins: [
    dash(),
    admin(),
    magicLink({
      storeToken: "hashed",
      sendMagicLink: async ({ email, url }) => {
        const content = magicLinkEmail({ url, appName: APP_NAME });
        await sendEmail({ to: email, ...content });
      },
    }),
    emailOTP({
      storeOTP: "hashed",
      overrideDefaultEmailVerification: true,
      sendVerificationOnSignUp: true,
      sendVerificationOTP: async ({ email, otp, type }) => {
        const content = otpEmail({
          otp,
          type: type === "forget-password" || type === "email-verification" ? type : "sign-in",
          appName: APP_NAME,
        });
        await sendEmail({ to: email, ...content });
      },
    }),
  ],

  databaseHooks: {
    user: {
      create: {
        before: async (_user, context) => {
          // Admin-initiated provisioning (admin plugin) bypasses the switch.
          const path = (context as { path?: string } | null)?.path;
          if (typeof path === "string" && path.startsWith("/admin")) return;

          await dbConnect();
          const settings = await Settings.findOne()
            .select({ registrationEnabled: 1 })
            .lean();

          if (settings && settings.registrationEnabled === false) {
            throw new APIError("BAD_REQUEST", {
              message: "Registration is currently disabled.",
            });
          }
        },
        after: async (user) => {
          try {
            await ensurePersonalTeam({
              id: user.id,
              name: user.name ?? null,
              email: user.email ?? null,
            });
          } catch (error) {
            // Never fail account creation because team provisioning hiccuped;
            // the personal team is re-provisioned lazily on first access.
            console.error("[auth] Personal team provisioning failed:", error);
          }
        },
      },
    },
  },

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    minPasswordLength: 10,
    maxPasswordLength: 128,
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

  socialProviders,
});

export type AuthSession = typeof auth.$Infer.Session;
