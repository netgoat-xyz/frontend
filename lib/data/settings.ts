import { cache } from "react";

import {
  normalizeDynamicRulesConfig,
  type DynamicRulesConfig,
} from "@/lib/agent-config";
import { bannerVariantOrDefault, type BannerVariant } from "@/lib/banner-variants";
import dbConnect from "@/lib/mongoose";
import Settings from "@/models/Settings";

/* -------------------------------------------------------------------------- */
/* Public projection                                                          */
/* -------------------------------------------------------------------------- */

export type PublicFeatureFlag = {
  key: string;
  description: string;
  isActive: boolean;
  percentage: number;
  variants: string[];
};

export type PublicSettings = {
  siteName: string;
  registrationEnabled: boolean;
  maintenanceMode: boolean;
  proEnabled: boolean;
  dnsEnabled: boolean;
  reverseProxyEnabled: boolean;
  globalBannerEnabled: boolean;
  globalBannerText: string;
  globalBannerVariant: BannerVariant;
  featureFlags: PublicFeatureFlag[];
};

const PUBLIC_DEFAULTS: PublicSettings = {
  siteName: "NetGoat",
  registrationEnabled: true,
  maintenanceMode: false,
  proEnabled: false,
  dnsEnabled: true,
  reverseProxyEnabled: true,
  globalBannerEnabled: false,
  globalBannerText: "",
  globalBannerVariant: "info",
  featureFlags: [],
};

/**
 * The single settings document, created with defaults on first read.
 *
 * Deliberately a narrow projection: sentry credentials, quota limits, audit
 * retention and the agent configuration must never reach anonymous callers.
 * React `cache()` makes repeated calls in one render pass free.
 */
export const getPublicSettings = cache(async (): Promise<PublicSettings> => {
  await dbConnect();

  const settings = await Settings.findOneAndUpdate(
    {},
    { $setOnInsert: { siteName: "NetGoat", registrationEnabled: true } },
    { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
  )
    .select(
      "siteName registrationEnabled maintenanceMode proEnabled dnsEnabled reverseProxyEnabled globalBannerEnabled globalBannerText globalBannerVariant featureFlags",
    )
    .lean<{
      siteName?: string;
      registrationEnabled?: boolean;
      maintenanceMode?: boolean;
      proEnabled?: boolean;
      dnsEnabled?: boolean;
      reverseProxyEnabled?: boolean;
      globalBannerEnabled?: boolean;
      globalBannerText?: string;
      globalBannerVariant?: string;
      featureFlags?: Array<{
        key?: string;
        description?: string;
        isActive?: boolean;
        percentage?: number;
        variants?: string[];
      }>;
    } | null>();

  if (!settings) return PUBLIC_DEFAULTS;

  return {
    siteName: settings.siteName || PUBLIC_DEFAULTS.siteName,
    registrationEnabled:
      settings.registrationEnabled ?? PUBLIC_DEFAULTS.registrationEnabled,
    maintenanceMode: settings.maintenanceMode ?? PUBLIC_DEFAULTS.maintenanceMode,
    proEnabled: settings.proEnabled ?? PUBLIC_DEFAULTS.proEnabled,
    dnsEnabled: settings.dnsEnabled ?? PUBLIC_DEFAULTS.dnsEnabled,
    reverseProxyEnabled:
      settings.reverseProxyEnabled ?? PUBLIC_DEFAULTS.reverseProxyEnabled,
    globalBannerEnabled:
      settings.globalBannerEnabled ?? PUBLIC_DEFAULTS.globalBannerEnabled,
    globalBannerText: settings.globalBannerText ?? PUBLIC_DEFAULTS.globalBannerText,
    globalBannerVariant: bannerVariantOrDefault(settings.globalBannerVariant),
    featureFlags: (settings.featureFlags ?? []).flatMap((flag) =>
      flag.key
        ? [
            {
              key: flag.key,
              description: flag.description ?? "",
              isActive: Boolean(flag.isActive),
              percentage: flag.percentage ?? 0,
              variants: flag.variants ?? [],
            },
          ]
        : [],
    ),
  };
});

/* -------------------------------------------------------------------------- */
/* Admin view                                                                 */
/* -------------------------------------------------------------------------- */

export type AdminSettings = SettingsUpdateShape & {
  dynamicRules: DynamicRulesConfig;
};

type SettingsUpdateShape = {
  siteName: string;
  registrationEnabled: boolean;
  maintenanceMode: boolean;
  sentryEnabled: boolean;
  sentryDsn: string;
  proEnabled: boolean;
  dnsEnabled: boolean;
  reverseProxyEnabled: boolean;
  userDomainLimit: number;
  dnsRecordLimit: number;
  organizationLimit: number;
  auditLogRetentionDays: number;
  globalBannerEnabled: boolean;
  globalBannerText: string;
  globalBannerVariant: BannerVariant;
  featureFlags: PublicFeatureFlag[];
};

/** Full settings for the admin form, with the agent config normalized. */
export async function getAdminSettings(): Promise<AdminSettings> {
  await dbConnect();

  const settings = await Settings.findOneAndUpdate(
    {},
    { $setOnInsert: { siteName: "NetGoat", registrationEnabled: true } },
    { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
  ).lean<Record<string, unknown> | null>();

  const value = settings ?? {};
  const agentConfig =
    typeof value.agentConfig === "object" && value.agentConfig !== null
      ? (value.agentConfig as Record<string, unknown>)
      : {};

  return {
    siteName: String(value.siteName || PUBLIC_DEFAULTS.siteName),
    registrationEnabled:
      value.registrationEnabled !== undefined
        ? Boolean(value.registrationEnabled)
        : PUBLIC_DEFAULTS.registrationEnabled,
    maintenanceMode: Boolean(value.maintenanceMode),
    sentryEnabled: Boolean(value.sentryEnabled),
    sentryDsn: String(value.sentryDsn ?? ""),
    proEnabled: Boolean(value.proEnabled),
    dnsEnabled:
      value.dnsEnabled !== undefined ? Boolean(value.dnsEnabled) : true,
    reverseProxyEnabled:
      value.reverseProxyEnabled !== undefined
        ? Boolean(value.reverseProxyEnabled)
        : true,
    userDomainLimit: Number(value.userDomainLimit ?? 3),
    dnsRecordLimit: Number(value.dnsRecordLimit ?? 50),
    organizationLimit: Number(value.organizationLimit ?? 1),
    auditLogRetentionDays: Number(value.auditLogRetentionDays ?? 30),
    globalBannerEnabled: Boolean(value.globalBannerEnabled),
    globalBannerText: String(value.globalBannerText ?? ""),
    globalBannerVariant: bannerVariantOrDefault(value.globalBannerVariant),
    featureFlags: Array.isArray(value.featureFlags)
      ? (value.featureFlags as PublicFeatureFlag[])
      : [],
    dynamicRules: normalizeDynamicRulesConfig(agentConfig.dynamic_rules),
  };
}
