import { z } from "zod";

/**
 * Server-side environment contract for frontend-v2.
 *
 * Parsed lazily on first access so that `next build` and static rendering
 * never require runtime secrets. Missing or malformed values fail loudly at
 * the first server access instead of producing undefined behaviour deeper in
 * a request.
 */
const serverEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),

  // Core
  MONGODB_URI: z.string().min(1, "MONGODB_URI is required"),
  BETTER_AUTH_SECRET: z
    .string()
    .min(16, "BETTER_AUTH_SECRET must be at least 16 characters"),
  BETTER_AUTH_URL: z.string().url().optional(),
  NEXT_PUBLIC_SITE_URL: z.string().url().optional(),

  // Email
  RESEND_APIKEY: z.string().min(1, "RESEND_APIKEY is required"),
  EMAIL_FROM: z.string().min(3).default("noreply@netgoat.app"),

  // Control plane / edge agent API
  EXTERNAL_API_URL: z.string().url().default("http://localhost:8787"),

  // Cron
  CRON_SECRET: z.string().min(1).optional(),

  // Social providers
  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),
  GITLAB_CLIENT_ID: z.string().optional(),
  GITLAB_CLIENT_SECRET: z.string().optional(),
  DISCORD_CLIENT_ID: z.string().optional(),
  DISCORD_CLIENT_SECRET: z.string().optional(),

  // Billing (Polar)
  POLAR_ACCESS_TOKEN: z.string().optional(),
  POLAR_SERVER: z.enum(["sandbox", "production"]).optional(),
  POLAR_PRODUCT_ID_PRO_MONTHLY: z.string().optional(),
  POLAR_PRODUCT_ID_PRO_YEARLY: z.string().optional(),
  POLAR_PRODUCT_ID_ENTERPRISE_MONTHLY: z.string().optional(),
  POLAR_PRODUCT_ID_ENTERPRISE_YEARLY: z.string().optional(),
  POLAR_PRODUCT_PRO_MONTHLY_PRICE: z.string().optional(),
  POLAR_PRODUCT_PRO_ANNUAL_PRICE: z.string().optional(),
  POLAR_PRODUCT_ENTERPRISE_MONTHLY_PRICE: z.string().optional(),
  POLAR_PRODUCT_ENTERPRISE_ANNUAL_PRICE: z.string().optional(),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

let cachedEnv: ServerEnv | null = null;

/**
 * Returns the validated server environment. Throws on the first access when
 * required variables are missing.
 */
export function serverEnv(): ServerEnv {
  if (cachedEnv) return cachedEnv;

  const parsed = serverEnvSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");
    throw new Error(`Invalid server environment:\n${issues}`);
  }

  cachedEnv = parsed.data;
  return cachedEnv;
}

/**
 * The canonical public origin of this deployment, used for links in emails,
 * redirects and metadata. Falls back to the local dev port.
 */
export function siteUrl(): string {
  const env = serverEnv();
  return (
    env.NEXT_PUBLIC_SITE_URL ??
    env.BETTER_AUTH_URL ??
    `http://localhost:${process.env.PORT ?? "3002"}`
  );
}
