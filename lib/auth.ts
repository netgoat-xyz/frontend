import { betterAuth, APIError } from "better-auth";
import { MongoClient } from "mongodb";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import dbConnect from "@/lib/mongoose";
import Settings from "@/models/Settings";
import { Team } from "@/models/Team";

const client = new MongoClient(process.env.MONGODB_URI!, {
  tls: true,
  tlsAllowInvalidCertificates: true,
  tlsAllowInvalidHostnames: true,
});
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
    after: async (ctx) => {
      const reqUrl = ctx.request?.url;
      // Create personal team for new users (non-blocking)
      if (reqUrl?.includes("/sign-up/email")) {
        // Run team creation asynchronously without blocking the response
        setImmediate(async () => {
          try {
            await dbConnect();
            // Fetch the latest user from database to get the created user info
            const users = await db.collection('user').find().sort({_id: -1}).limit(1).toArray();
            const user = users[0];
            
            if (!user) return;
            
            const userId = user.id;
            const userEmail = user.email;
            const userName = user.name || userEmail?.split('@')[0] || 'User';
            
            // Use user-specific slug to avoid unique constraint issues
            const personalSlug = `@me-${userId}`;
            
            // Check if personal team already exists for this user
            const existingTeam = await Team.findOne({
              slug: personalSlug
            });
            
            if (!existingTeam) {
              // Create personal team with user-specific slug
              await Team.create({
                name: `${userName}'s Personal Team`,
                slug: personalSlug,
                description: 'Your personal team',
                members: [{
                  user_id: userId,
                  role: 'owner',
                  joined_at: new Date()
                }],
                active: true
              });
              
              console.log(`Created personal team ${personalSlug} for user ${userId}`);
            }
          } catch (error) {
            console.error('Failed to create personal team:', error);
          }
        });
      }
      
      // Always return to allow the hook to complete properly
      return ctx;
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