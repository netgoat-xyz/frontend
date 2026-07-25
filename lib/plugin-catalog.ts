import { createHash } from "node:crypto";

export const BUILTIN_MIDDLEWARE_MANIFEST_KIND = "builtin-middleware-v1" as const;
export const BUILTIN_MIDDLEWARE_API_VERSION = "netgoat.dev/middleware/v1" as const;

export const MIDDLEWARE_CAPABILITIES = [
  "request.read",
  "route.read",
  "response.write",
] as const;

export type MiddlewareCapability = (typeof MIDDLEWARE_CAPABILITIES)[number];
export type PublisherVerificationStatus =
  | "unverified"
  | "pending"
  | "verified"
  | "rejected";

export type PluginJsonPrimitive = string | number | boolean | null;
export type PluginJsonValue =
  | PluginJsonPrimitive
  | PluginJsonValue[]
  | { [key: string]: PluginJsonValue };
export type PluginConfig = Record<string, PluginJsonValue>;

/**
 * A catalog release can only reference a factory that is already compiled
 * into the agent. This deliberately has no URL, source, artifact, module, or
 * executable payload field.
 */
export interface BuiltinMiddlewareManifest {
  kind: typeof BUILTIN_MIDDLEWARE_MANIFEST_KIND;
  api_version: typeof BUILTIN_MIDDLEWARE_API_VERSION;
  factory_id: string;
  granted_capabilities: MiddlewareCapability[];
  config: PluginConfig;
}

export interface PluginDeploymentSelection {
  plugin_id: string;
  factory_id: string;
  version: string;
  sha256: string;
  api_version: typeof BUILTIN_MIDDLEWARE_API_VERSION;
  granted_capabilities: MiddlewareCapability[];
  config: PluginConfig;
}

export interface PublisherProfileInput {
  slug: string;
  display_name: string;
  description?: string;
  website_url?: string;
  support_url?: string;
}

export interface DeveloperPluginInput {
  publisher_id: string;
  slug: string;
  name: string;
  summary: string;
  description?: string;
  category?: string;
  tags?: string[];
}

export interface PluginReleaseInput {
  version: string;
  changelog?: string;
  /** SHA-256 from the compiled-in agent descriptor, not the manifest hash. */
  descriptor_sha256: string;
  manifest: BuiltinMiddlewareManifest;
}

export const PLUGIN_CATALOG_LIMITS = {
  maxSlugLength: 80,
  maxCatalogPluginIdLength: 128,
  maxPublisherNameLength: 96,
  maxPluginNameLength: 96,
  maxSummaryLength: 280,
  maxDescriptionLength: 8 * 1024,
  maxChangelogLength: 8 * 1024,
  maxTags: 12,
  maxTagLength: 32,
  maxFactoryIdLength: 80,
  maxConfigBytes: 16 * 1024,
  maxConfigDepth: 8,
  maxConfigKeys: 100,
  maxConfigArrayItems: 64,
  maxConfigStringLength: 2048,
} as const;

const SLUG_PATTERN = /^[a-z0-9](?:[a-z0-9-]{0,78}[a-z0-9])?$/;
const FACTORY_ID_PATTERN = /^[a-z0-9][a-z0-9._/-]{0,79}$/;
const SEMVER_PATTERN = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/;
const CONTROL_CHARACTERS = /[\u0000-\u001f\u007f]/;
const DISALLOWED_CONFIG_KEYS = new Set([
  "source",
  "code",
  "script",
  "artifact",
  "artifact_url",
  "module",
  "module_url",
  "wasm",
  "binary",
  "bundle",
  "payload",
  "secret",
  "password",
  "token",
  "api_key",
  "apikey",
  "private_key",
  "credential",
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function byteLength(value: string): number {
  return new TextEncoder().encode(value).byteLength;
}

function boundedInteger(value: number): number {
  return Number.isInteger(value) && value > 0 ? value : 0;
}

function normalizeText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function validateUrl(value: string, label: string, errors: string[]) {
  if (!value) return;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") {
      errors.push(`${label} must use HTTPS.`);
    }
  } catch {
    errors.push(`${label} must be a valid HTTPS URL.`);
  }
}

export function normalizeCatalogSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, PLUGIN_CATALOG_LIMITS.maxSlugLength);
}

export function validateCatalogSlug(value: unknown, label = "Slug"): string[] {
  const slug = normalizeText(value);
  if (slug.length < 2 || slug.length > PLUGIN_CATALOG_LIMITS.maxSlugLength || !SLUG_PATTERN.test(slug)) {
    return [`${label} must use lowercase letters, numbers, and internal hyphens (2-${PLUGIN_CATALOG_LIMITS.maxSlugLength} characters).`];
  }
  return [];
}

export function validateReleaseVersion(value: unknown): string[] {
  const version = normalizeText(value);
  return SEMVER_PATTERN.test(version)
    ? []
    : ["Release version must be valid semantic versioning, for example 1.2.3."];
}

export function validateSHA256(value: unknown, label = "SHA-256"): string[] {
  const digest = normalizeText(value).toLowerCase();
  return /^[a-f0-9]{64}$/.test(digest)
    ? []
    : [`${label} must be a lowercase 64-character SHA-256 digest.`];
}

/**
 * This ID is shared with the compiled-in agent descriptor. It is intentionally
 * human-stable, unlike MongoDB document IDs, so a release can be verified by
 * an agent without a control-plane database lookup.
 */
export function catalogPluginId(publisherSlug: string, pluginSlug: string): string {
  const publisherErrors = validateCatalogSlug(publisherSlug, "Publisher slug");
  const pluginErrors = validateCatalogSlug(pluginSlug, "Plugin slug");
  if (publisherErrors.length > 0 || pluginErrors.length > 0) {
    throw new Error([...publisherErrors, ...pluginErrors].join(" "));
  }
  const pluginId = `${publisherSlug.trim().toLowerCase()}/${pluginSlug.trim().toLowerCase()}`;
  if (pluginId.length > PLUGIN_CATALOG_LIMITS.maxCatalogPluginIdLength) {
    throw new Error(`Plugin identity must not exceed ${PLUGIN_CATALOG_LIMITS.maxCatalogPluginIdLength} characters.`);
  }
  return pluginId;
}

export function normalizeTags(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  const tags: string[] = [];
  for (const item of value) {
    const tag = normalizeText(item).toLowerCase();
    if (
      !tag ||
      tag.length > PLUGIN_CATALOG_LIMITS.maxTagLength ||
      CONTROL_CHARACTERS.test(tag) ||
      tags.includes(tag)
    ) {
      continue;
    }
    tags.push(tag);
    if (tags.length >= PLUGIN_CATALOG_LIMITS.maxTags) break;
  }
  return tags;
}

export function validatePublisherProfileInput(value: unknown): string[] {
  if (!isRecord(value)) return ["Publisher profile must be an object."];

  const errors = validateCatalogSlug(value.slug, "Publisher slug");
  const displayName = normalizeText(value.display_name);
  if (!displayName || displayName.length > PLUGIN_CATALOG_LIMITS.maxPublisherNameLength || CONTROL_CHARACTERS.test(displayName)) {
    errors.push(`Publisher name must be between 1 and ${PLUGIN_CATALOG_LIMITS.maxPublisherNameLength} readable characters.`);
  }

  for (const [key, label, maxLength] of [
    ["description", "Publisher description", PLUGIN_CATALOG_LIMITS.maxDescriptionLength],
    ["website_url", "Website URL", 2048],
    ["support_url", "Support URL", 2048],
  ] as const) {
    const text = normalizeText(value[key]);
    if (text.length > maxLength || CONTROL_CHARACTERS.test(text)) {
      errors.push(`${label} is too long or contains control characters.`);
    }
  }
  validateUrl(normalizeText(value.website_url), "Website URL", errors);
  validateUrl(normalizeText(value.support_url), "Support URL", errors);
  return errors;
}

export function validateDeveloperPluginInput(value: unknown): string[] {
  if (!isRecord(value)) return ["Plugin must be an object."];

  const errors = validateCatalogSlug(value.slug, "Plugin slug");
  const name = normalizeText(value.name);
  const summary = normalizeText(value.summary);
  const description = normalizeText(value.description);
  const category = normalizeText(value.category);

  if (!name || name.length > PLUGIN_CATALOG_LIMITS.maxPluginNameLength || CONTROL_CHARACTERS.test(name)) {
    errors.push(`Plugin name must be between 1 and ${PLUGIN_CATALOG_LIMITS.maxPluginNameLength} readable characters.`);
  }
  if (!summary || summary.length > PLUGIN_CATALOG_LIMITS.maxSummaryLength || CONTROL_CHARACTERS.test(summary)) {
    errors.push(`Plugin summary must be between 1 and ${PLUGIN_CATALOG_LIMITS.maxSummaryLength} readable characters.`);
  }
  if (description.length > PLUGIN_CATALOG_LIMITS.maxDescriptionLength || CONTROL_CHARACTERS.test(description)) {
    errors.push("Plugin description is too long or contains control characters.");
  }
  if (category && (!/^[a-z0-9-]{1,40}$/.test(category) || CONTROL_CHARACTERS.test(category))) {
    errors.push("Plugin category must use lowercase letters, numbers, and hyphens.");
  }
  if (Array.isArray(value.tags) && value.tags.length > PLUGIN_CATALOG_LIMITS.maxTags) {
    errors.push(`Plugins can have at most ${PLUGIN_CATALOG_LIMITS.maxTags} tags.`);
  }
  if (normalizeTags(value.tags).length !== (Array.isArray(value.tags) ? value.tags.length : 0)) {
    errors.push("Plugin tags must be unique, readable, and within the allowed length.");
  }
  return errors;
}

function validateJsonValue(
  value: unknown,
  path: string,
  depth: number,
  state: { keys: number },
  errors: string[],
): value is PluginJsonValue {
  if (value === null || typeof value === "boolean") return true;
  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      errors.push(`${path} must not contain non-finite numbers.`);
      return false;
    }
    return true;
  }
  if (typeof value === "string") {
    if (value.length > PLUGIN_CATALOG_LIMITS.maxConfigStringLength || value.includes("\u0000")) {
      errors.push(`${path} contains an oversized or invalid string.`);
      return false;
    }
    return true;
  }
  if (depth >= PLUGIN_CATALOG_LIMITS.maxConfigDepth) {
    errors.push(`${path} exceeds the maximum configuration depth.`);
    return false;
  }
  if (Array.isArray(value)) {
    if (value.length > PLUGIN_CATALOG_LIMITS.maxConfigArrayItems) {
      errors.push(`${path} exceeds the maximum array size.`);
      return false;
    }
    return value.every((item, index) => validateJsonValue(item, `${path}[${index}]`, depth + 1, state, errors));
  }
  if (!isRecord(value)) {
    errors.push(`${path} must contain JSON-compatible values only.`);
    return false;
  }

  for (const [key, nested] of Object.entries(value)) {
    state.keys += 1;
    if (state.keys > PLUGIN_CATALOG_LIMITS.maxConfigKeys) {
      errors.push(`Configuration exceeds ${PLUGIN_CATALOG_LIMITS.maxConfigKeys} keys.`);
      return false;
    }
    const normalizedKey = key.trim().toLowerCase();
    if (!key || CONTROL_CHARACTERS.test(key)) {
      errors.push(`${path} contains an invalid configuration key.`);
      return false;
    }
    if (DISALLOWED_CONFIG_KEYS.has(normalizedKey)) {
      errors.push(`${path}.${key} is not permitted in a built-in middleware manifest.`);
      return false;
    }
    if (!validateJsonValue(nested, `${path}.${key}`, depth + 1, state, errors)) {
      return false;
    }
  }
  return true;
}

export function validateBuiltinMiddlewareManifest(value: unknown): string[] {
  if (!isRecord(value)) return ["Plugin manifest must be an object."];

  const errors: string[] = [];
  const allowedKeys = new Set(["kind", "api_version", "factory_id", "granted_capabilities", "config"]);
  for (const key of Object.keys(value)) {
    if (!allowedKeys.has(key)) {
      errors.push(`Plugin manifest field ${key} is not permitted.`);
    }
  }

  if (value.kind !== BUILTIN_MIDDLEWARE_MANIFEST_KIND) {
    errors.push(`Plugin manifest kind must be ${BUILTIN_MIDDLEWARE_MANIFEST_KIND}.`);
  }
  if (value.api_version !== BUILTIN_MIDDLEWARE_API_VERSION) {
    errors.push(`Plugin manifest API version must be ${BUILTIN_MIDDLEWARE_API_VERSION}.`);
  }

  const factoryId = normalizeText(value.factory_id);
  if (
    !factoryId ||
    factoryId.length > PLUGIN_CATALOG_LIMITS.maxFactoryIdLength ||
    !FACTORY_ID_PATTERN.test(factoryId) ||
    factoryId.includes("..")
  ) {
    errors.push("Factory id must be a bounded lowercase compiled-in factory identifier.");
  }

  if (!Array.isArray(value.granted_capabilities)) {
    errors.push("Granted capabilities must be a list.");
  } else {
    const seen = new Set<string>();
    for (const capability of value.granted_capabilities) {
      if (typeof capability !== "string" || !MIDDLEWARE_CAPABILITIES.includes(capability as MiddlewareCapability)) {
        errors.push(`Unknown middleware capability: ${String(capability)}.`);
        continue;
      }
      if (seen.has(capability)) {
        errors.push(`Middleware capability ${capability} is duplicated.`);
      }
      seen.add(capability);
    }
  }

  if (!isRecord(value.config)) {
    errors.push("Plugin manifest config must be an object.");
  } else {
    const configErrors: string[] = [];
    validateJsonValue(value.config, "config", 0, { keys: 0 }, configErrors);
    const serialized = configErrors.length === 0 ? canonicalizeJson(value.config as PluginJsonValue) : "";
    if (serialized && byteLength(serialized) > PLUGIN_CATALOG_LIMITS.maxConfigBytes) {
      configErrors.push(`Plugin configuration exceeds ${PLUGIN_CATALOG_LIMITS.maxConfigBytes.toLocaleString()} bytes.`);
    }
    errors.push(...configErrors);
  }

  return errors;
}

/**
 * Valid manifests are normalized before hashing so reordering capabilities or
 * configuration keys cannot create a different release identity.
 */
export function normalizeBuiltinMiddlewareManifest(value: unknown): BuiltinMiddlewareManifest {
  const errors = validateBuiltinMiddlewareManifest(value);
  if (errors.length > 0 || !isRecord(value)) {
    throw new Error(errors.join(" ") || "Plugin manifest is invalid.");
  }

  const config = JSON.parse(canonicalizeJson(value.config as PluginJsonValue)) as PluginConfig;
  return {
    kind: BUILTIN_MIDDLEWARE_MANIFEST_KIND,
    api_version: BUILTIN_MIDDLEWARE_API_VERSION,
    factory_id: normalizeText(value.factory_id),
    granted_capabilities: [...(value.granted_capabilities as MiddlewareCapability[])].sort(),
    config,
  };
}

export function canonicalizeJson(value: PluginJsonValue): string {
  if (value === null) return "null";
  if (typeof value === "string" || typeof value === "boolean") return JSON.stringify(value);
  if (typeof value === "number") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map((item) => canonicalizeJson(item)).join(",")}]`;
  return `{${Object.keys(value)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${canonicalizeJson(value[key])}`)
    .join(",")}}`;
}

export function canonicalizeBuiltinMiddlewareManifest(manifest: BuiltinMiddlewareManifest): string {
  return canonicalizeJson(manifest as unknown as PluginJsonValue);
}

export function hashBuiltinMiddlewareManifest(manifest: BuiltinMiddlewareManifest): string {
  return createHash("sha256").update(canonicalizeBuiltinMiddlewareManifest(manifest)).digest("hex");
}

export function deploymentSelectionFromManifest(
  pluginId: string,
  version: string,
  manifest: BuiltinMiddlewareManifest,
  descriptorSha256: string,
): PluginDeploymentSelection {
  if (validateSHA256(descriptorSha256, "Plugin descriptor SHA-256").length > 0) {
    throw new Error("Plugin descriptor SHA-256 is invalid.");
  }
  if (validateReleaseVersion(version).length > 0) {
    throw new Error("Plugin release version is invalid.");
  }
  const normalized = normalizeBuiltinMiddlewareManifest(manifest);
  return {
    plugin_id: pluginId,
    factory_id: normalized.factory_id,
    version: version.trim(),
    // The agent verifies its compiled descriptor with this digest. The
    // immutable manifest hash remains in the catalog for audit integrity.
    sha256: descriptorSha256,
    api_version: normalized.api_version,
    granted_capabilities: normalized.granted_capabilities,
    config: normalized.config,
  };
}

export interface PublisherCredibilityInput {
  verification_status: PublisherVerificationStatus;
  approved_release_count: number;
  active_installation_count: number;
  rejected_review_count: number;
  suspended?: boolean;
}

export interface PublisherCredibility {
  score: number;
  base_points: number;
  verification_points: number;
  release_points: number;
  installation_points: number;
  review_penalty: number;
}

/**
 * This is intentionally deterministic and only consumes server-derived
 * counts. The score is informative; it never grants runtime permissions.
 */
export function calculatePublisherCredibility(input: PublisherCredibilityInput): PublisherCredibility {
  if (input.suspended) {
    return {
      score: 0,
      base_points: 0,
      verification_points: 0,
      release_points: 0,
      installation_points: 0,
      review_penalty: 0,
    };
  }

  const basePoints = 10;
  const verificationPoints = input.verification_status === "verified" ? 40 : 0;
  const releasePoints = Math.min(25, boundedInteger(input.approved_release_count) * 5);
  const installationPoints = Math.min(25, boundedInteger(input.active_installation_count));
  const reviewPenalty = Math.min(20, boundedInteger(input.rejected_review_count) * 5);
  return {
    score: Math.max(0, Math.min(100, basePoints + verificationPoints + releasePoints + installationPoints - reviewPenalty)),
    base_points: basePoints,
    verification_points: verificationPoints,
    release_points: releasePoints,
    installation_points: installationPoints,
    review_penalty: reviewPenalty,
  };
}
