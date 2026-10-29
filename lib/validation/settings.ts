import { z } from "zod";

import { BANNER_VARIANT_KEYS } from "@/lib/banner-variants";

const featureFlagSchema = z.object({
  key: z
    .string()
    .trim()
    .min(1, "A flag needs a key.")
    .max(50)
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Flag keys use lowercase words and dashes."),
  description: z.string().trim().max(200),
  isActive: z.boolean(),
  percentage: z.number().int().min(0).max(100),
  variants: z.array(z.string().trim().min(1).max(50)).max(20),
});

/**
 * Strict allowlist for the settings form. Unknown keys are stripped rather
 * than written, and every value has a bound — the previous version passed the
 * client's object straight into `$set`, which let the form (or a crafted
 * request) write any schema field.
 */
export const settingsUpdateSchema = z.object({
  siteName: z.string().trim().min(1, "A site name is required.").max(100),
  registrationEnabled: z.boolean(),
  maintenanceMode: z.boolean(),

  sentryEnabled: z.boolean(),
  sentryDsn: z
    .string()
    .trim()
    .max(500)
    .refine(
      (value) => value === "" || /^https?:\/\//i.test(value),
      "A DSN must be an http(s) URL.",
    ),

  proEnabled: z.boolean(),
  dnsEnabled: z.boolean(),
  reverseProxyEnabled: z.boolean(),

  userDomainLimit: z.number().int().min(0).max(10_000),
  dnsRecordLimit: z.number().int().min(0).max(100_000),
  organizationLimit: z.number().int().min(0).max(1_000),
  auditLogRetentionDays: z.number().int().min(1).max(3_650),

  globalBannerEnabled: z.boolean(),
  globalBannerText: z.string().trim().max(500),
  globalBannerVariant: z.enum(BANNER_VARIANT_KEYS),

  featureFlags: z.array(featureFlagSchema).max(50),
});

export type SettingsUpdateInput = z.infer<typeof settingsUpdateSchema>;
export type FeatureFlagInput = z.infer<typeof featureFlagSchema>;
