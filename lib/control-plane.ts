/**
 * Control-plane contracts.
 *
 * These shapes are the interface between the dashboard and the edge agents:
 * agents poll MongoDB and apply `route_policy` (emitted as `policy`), WAF rules
 * and access control lists. Keep field names stable.
 */

import { z } from "zod";

/* -------------------------------------------------------------------------- */
/* Route policy (cache + bandwidth)                                           */
/* -------------------------------------------------------------------------- */

export const ROUTE_KEY_MODES = ["ip", "host", "route", "global"] as const;
export type RouteKeyMode = (typeof ROUTE_KEY_MODES)[number];

export type RoutePolicy = {
  cache?: {
    enabled?: boolean;
    ttl_seconds?: number;
    max_entries?: number;
    max_body_bytes?: number;
  };
  bandwidth?: {
    enabled?: boolean;
    bytes_per_second?: number;
    burst_bytes?: number;
    key?: RouteKeyMode;
  };
};

export const routePolicySchema: z.ZodType<RoutePolicy> = z
  .object({
    cache: z
      .object({
        enabled: z.boolean().optional(),
        ttl_seconds: z.number().int().min(1).max(86_400).optional(),
        max_entries: z.number().int().min(1).max(100_000).optional(),
        max_body_bytes: z.number().int().min(1024).max(104_857_600).optional(),
      })
      .strict()
      .optional(),
    bandwidth: z
      .object({
        enabled: z.boolean().optional(),
        bytes_per_second: z
          .number()
          .int()
          .min(1024)
          .max(10_737_418_240)
          .optional(),
        burst_bytes: z
          .number()
          .int()
          .min(1024)
          .max(10_737_418_240)
          .optional(),
        key: z.enum(ROUTE_KEY_MODES).optional(),
      })
      .strict()
      .optional(),
  })
  .strict();

/**
 * Normalizes an untrusted route policy. Returns `null` when the policy carries
 * no instructions (callers `$unset` the field in that case). Throws on invalid
 * shapes so actions can surface the message.
 */
export function normalizeRoutePolicy(value: unknown): RoutePolicy | null {
  if (value === null || value === undefined) return null;

  const parsed = routePolicySchema.safeParse(value);
  if (!parsed.success) {
    throw new Error("That route policy is not valid.");
  }

  const policy = parsed.data;
  const cache = policy.cache && Object.values(policy.cache).some((v) => v !== undefined)
    ? policy.cache
    : undefined;
  const bandwidth =
    policy.bandwidth && Object.values(policy.bandwidth).some((v) => v !== undefined)
      ? policy.bandwidth
      : undefined;

  if (!cache && !bandwidth) return null;
  return { ...(cache ? { cache } : {}), ...(bandwidth ? { bandwidth } : {}) };
}

/* -------------------------------------------------------------------------- */
/* PEM material                                                               */
/* -------------------------------------------------------------------------- */

export type NormalizedPem = {
  certificate_pem: string | null;
  private_key_pem: string | null;
  ssl_enabled: boolean;
};

const CERTIFICATE_HEADER = "-----BEGIN CERTIFICATE-----";
const PRIVATE_KEY_PATTERN = /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/;

/** Validates a certificate/key pair. Both present or both absent. */
export function normalizePemMaterial(
  certificatePem?: string | null,
  privateKeyPem?: string | null,
): NormalizedPem {
  const certificate = (certificatePem ?? "").trim();
  const privateKey = (privateKeyPem ?? "").trim();

  if (!certificate && !privateKey) {
    return { certificate_pem: null, private_key_pem: null, ssl_enabled: false };
  }

  if (!certificate || !privateKey) {
    throw new Error(
      "Provide both the certificate and its private key, or neither.",
    );
  }

  if (!certificate.includes(CERTIFICATE_HEADER)) {
    throw new Error("The certificate must be PEM-encoded.");
  }

  if (!PRIVATE_KEY_PATTERN.test(privateKey)) {
    throw new Error("The private key must be PEM-encoded.");
  }

  return {
    certificate_pem: certificate,
    private_key_pem: privateKey,
    ssl_enabled: true,
  };
}

/* -------------------------------------------------------------------------- */
/* WAF rules                                                                  */
/* -------------------------------------------------------------------------- */

export const WAF_ACTIONS = ["BLOCK", "ALLOW", "LOG"] as const;
export type WafAction = (typeof WAF_ACTIONS)[number];

export type NormalizedWafRule = {
  name: string;
  expression: string;
  action: WafAction;
  priority: number;
  enabled: boolean;
  description?: string;
  created_at: Date;
  updated_at: Date;
};

const wafRuleSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Give the rule a name.")
    .max(64, "Rule names are limited to 64 characters."),
  expression: z
    .string()
    .trim()
    .min(1, "Provide a match expression.")
    .max(512, "Expressions are limited to 512 characters."),
  action: z.enum(WAF_ACTIONS).default("BLOCK"),
  priority: z.number().int().min(0).max(100_000).default(0),
  enabled: z.boolean().default(true),
  description: z.string().trim().max(280).optional(),
});

/** Validates an untrusted WAF rule and stamps timestamps. */
export function normalizeWafRule(input: unknown): NormalizedWafRule {
  const parsed = wafRuleSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(
      parsed.error.issues[0]?.message ?? "That WAF rule is not valid.",
    );
  }

  const now = new Date();
  return { ...parsed.data, created_at: now, updated_at: now };
}

/* -------------------------------------------------------------------------- */
/* Access control                                                             */
/* -------------------------------------------------------------------------- */

export const ACCESS_MODES = ["off", "allowlist", "blocklist", "inherit"] as const;
export const PUBLISHED_ACCESS_MODES = ["off", "allowlist", "blocklist"] as const;

export type AccessMode = (typeof ACCESS_MODES)[number];
export type PublishedAccessMode = (typeof PUBLISHED_ACCESS_MODES)[number];

export type AccessControl = { mode: AccessMode; cidrs: string[] };
export type PublishedAccessControl = {
  mode: PublishedAccessMode;
  cidrs: string[];
};

export const MAX_ACCESS_CIDRS = 64;

function isIpv4(value: string): boolean {
  const parts = value.split(".");
  if (parts.length !== 4) return false;
  return parts.every((part) => {
    if (!/^\d{1,3}$/.test(part)) return false;
    const octet = Number(part);
    return octet >= 0 && octet <= 255 && String(octet) === part;
  });
}

function isIpv6(value: string): boolean {
  if (!value.includes(":") || value.includes(".")) return false;
  if (value.startsWith(":") && !value.startsWith("::")) return false;
  if (value.endsWith(":") && !value.endsWith("::")) return false;
  if (value.split("::").length > 2) return false;

  const groups = value.split(":").filter((group) => group.length > 0);
  if (value.includes("::")) {
    if (groups.length > 7) return false;
  } else if (groups.length !== 8) {
    return false;
  }
  return groups.every((group) => /^[0-9a-f]{1,4}$/.test(group));
}

/** Normalizes a single address/CIDR; null when invalid. */
export function normalizeAccessCidr(value: string): string | null {
  const trimmed = value.trim().toLowerCase();
  if (!trimmed) return null;

  if (isIpv4(trimmed)) return `${trimmed}/32`;
  if (isIpv6(trimmed)) return `${trimmed}/128`;

  const slash = trimmed.lastIndexOf("/");
  if (slash <= 0) return null;

  const address = trimmed.slice(0, slash);
  const prefix = Number(trimmed.slice(slash + 1));
  if (!Number.isInteger(prefix)) return null;

  if (isIpv4(address)) {
    return prefix >= 0 && prefix <= 32 ? `${address}/${prefix}` : null;
  }
  if (isIpv6(address)) {
    return prefix >= 0 && prefix <= 128 ? `${address}/${prefix}` : null;
  }
  return null;
}

/** Parses a textarea/comma list of CIDRs, reporting which entries were bad. */
export function parseAccessCidrList(input: string | string[] | undefined): {
  cidrs: string[];
  invalid: string[];
} {
  const values = Array.isArray(input)
    ? input
    : (input ?? "")
        .split(/[\n,]+/)
        .map((entry) => entry.trim());

  const cidrs: string[] = [];
  const invalid: string[] = [];
  const seen = new Set<string>();

  for (const value of values) {
    if (!value) continue;
    const normalized = normalizeAccessCidr(value);
    if (!normalized) {
      invalid.push(value);
      continue;
    }
    if (seen.has(normalized)) continue;
    seen.add(normalized);
    cidrs.push(normalized);
  }

  return { cidrs, invalid };
}

/** Normalizes a stored access_control field, falling back gracefully. */
export function normalizeAccessControl(
  value: unknown,
  options: { allowInherit?: boolean; defaultMode?: AccessMode } = {},
): AccessControl {
  const allowInherit = Boolean(options.allowInherit);
  const fallback: AccessMode =
    options.defaultMode ?? (allowInherit ? "inherit" : "off");

  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { mode: fallback, cidrs: [] };
  }

  const raw = value as { mode?: unknown; cidrs?: unknown };
  const mode =
    typeof raw.mode === "string" && (ACCESS_MODES as readonly string[]).includes(raw.mode)
      ? (raw.mode as AccessMode)
      : fallback;

  if (mode === "inherit" && !allowInherit) {
    return { mode: fallback, cidrs: [] };
  }

  const { cidrs } = parseAccessCidrList(
    Array.isArray(raw.cidrs) ? (raw.cidrs as string[]) : undefined,
  );

  return { mode, cidrs: cidrs.slice(0, MAX_ACCESS_CIDRS) };
}

/**
 * Resolves the effective access control for a subdomain, following `inherit`
 * up to the domain-level policy. Used by the agent contract tests and the UI.
 */
export function resolvePublishedAccess(
  domain: AccessControl,
  subdomain?: AccessControl | null,
): PublishedAccessControl {
  const source =
    subdomain && subdomain.mode !== "inherit" ? subdomain : domain;
  const mode: PublishedAccessMode =
    source.mode === "allowlist" || source.mode === "blocklist"
      ? source.mode
      : "off";

  return { mode, cidrs: mode === "off" ? [] : source.cidrs };
}

/* -------------------------------------------------------------------------- */
/* Agent streamer contract                                                    */
/* -------------------------------------------------------------------------- */

/** Mongo fields the dashboard writes that the edge streamer reads. */
export const STREAMER_DOMAIN_FIELDS = [
  "domain",
  "target_url",
  "certificate_pem",
  "private_key_pem",
  "auto_ssl",
  "ssl_enabled",
  "waf_rules",
  "route_policy",
  "access_control",
  "subdomains",
] as const;

export const STREAMER_PROXY_FIELDS = [
  "domain_id",
  "subdomain",
  "upstream_servers",
  "enabled",
] as const;
