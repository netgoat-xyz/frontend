export type UnknownRecord = Record<string, unknown>;

export type CatalogPublisher = {
  id: string;
  slug: string;
  displayName: string;
  description: string;
  websiteUrl: string;
  supportUrl: string;
  status: string;
  verificationStatus: string;
  verificationNote: string;
  credibilityScore: number;
  credibilityBreakdown: {
    base: number;
    verification: number;
    releases: number;
    installations: number;
    reviewPenalty: number;
  };
  createdAt: string;
};

export type PluginManifest = {
  kind: string;
  apiVersion: string;
  factoryId: string;
  capabilities: string[];
  config: UnknownRecord;
};

export type CatalogRelease = {
  id: string;
  pluginId: string;
  publisherId: string;
  version: string;
  changelog: string;
  manifest: PluginManifest;
  sha256: string;
  descriptorSha256: string;
  status: string;
  reviewNote: string;
  submittedAt: string;
  reviewedAt: string;
  createdAt: string;
};

export type CatalogPlugin = {
  id: string;
  publisherId: string;
  slug: string;
  name: string;
  summary: string;
  description: string;
  category: string;
  tags: string[];
  status: string;
  createdAt: string;
  updatedAt: string;
  publisher: CatalogPublisher | null;
  currentRelease: CatalogRelease | null;
  releases: CatalogRelease[];
};

export type PluginInstallation = {
  id: string;
  teamId: string;
  pluginId: string;
  publisherId: string;
  releaseId: string;
  releaseVersion: string;
  manifestSha256: string;
  status: string;
  installedAt: string;
  updatedAt: string;
  plugin: CatalogPlugin | null;
  publisher: CatalogPublisher | null;
  release: CatalogRelease | null;
};

export type PluginDeployment = {
  id: string;
  pluginId: string;
  releaseId: string;
  factoryId: string;
  version: string;
  sha256: string;
  status: string;
  deployedAt: string;
  plugin: CatalogPlugin | null;
  release: CatalogRelease | null;
};

export type PluginReviewQueue = {
  publishers: CatalogPublisher[];
  releases: Array<CatalogRelease & { plugin: CatalogPlugin | null; publisher: CatalogPublisher | null }>;
};

export function asRecord(value: unknown): UnknownRecord {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as UnknownRecord
    : {};
}

export function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

export function asNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

export function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function readId(record: UnknownRecord): string {
  return asString(record.id) || asString(record._id);
}

function readDate(record: UnknownRecord, camelCase: string, snakeCase: string): string {
  return asString(record[camelCase]) || asString(record[snakeCase]);
}

function stringList(value: unknown): string[] {
  return asArray(value).flatMap((item) => typeof item === "string" ? [item] : []);
}

export function toPublisher(value: unknown): CatalogPublisher {
  const record = asRecord(value);
  const verification = asRecord(record.verification);
  const credibility = asRecord(record.credibility);

  return {
    id: readId(record),
    slug: asString(record.slug),
    displayName: asString(record.displayName) || asString(record.display_name),
    description: asString(record.description),
    websiteUrl: asString(record.websiteUrl) || asString(record.website_url),
    supportUrl: asString(record.supportUrl) || asString(record.support_url),
    status: asString(record.status, "active"),
    verificationStatus: asString(verification.status) || asString(record.verificationStatus, "unverified"),
    verificationNote: asString(verification.note) || asString(record.verificationNote),
    credibilityScore: asNumber(credibility.score, asNumber(record.credibilityScore)),
    credibilityBreakdown: {
      base: asNumber(credibility.base_points, asNumber(credibility.basePoints)),
      verification: asNumber(credibility.verification_points, asNumber(credibility.verificationPoints)),
      releases: asNumber(credibility.release_points, asNumber(credibility.releasePoints)),
      installations: asNumber(credibility.installation_points, asNumber(credibility.installationPoints)),
      reviewPenalty: asNumber(credibility.review_penalty, asNumber(credibility.reviewPenalty)),
    },
    createdAt: readDate(record, "createdAt", "created_at"),
  };
}

export function toManifest(value: unknown): PluginManifest {
  const record = asRecord(value);
  const config = asRecord(record.config);

  return {
    kind: asString(record.kind),
    apiVersion: asString(record.apiVersion) || asString(record.api_version),
    factoryId: asString(record.factoryId) || asString(record.factory_id),
    capabilities: stringList(record.grantedCapabilities ?? record.granted_capabilities),
    config,
  };
}

export function toRelease(value: unknown): CatalogRelease {
  const record = asRecord(value);
  return {
    id: readId(record),
    pluginId: asString(record.pluginId) || asString(record.plugin_id),
    publisherId: asString(record.publisherId) || asString(record.publisher_id),
    version: asString(record.version),
    changelog: asString(record.changelog),
    manifest: toManifest(record.manifest),
    sha256: asString(record.sha256) || asString(record.manifest_sha256),
    descriptorSha256: asString(record.descriptorSha256) || asString(record.descriptor_sha256),
    status: asString(record.status, "draft"),
    reviewNote: asString(record.reviewNote) || asString(record.review_note),
    submittedAt: readDate(record, "submittedAt", "submitted_at"),
    reviewedAt: readDate(record, "reviewedAt", "reviewed_at"),
    createdAt: readDate(record, "createdAt", "created_at"),
  };
}

export function toPlugin(value: unknown): CatalogPlugin {
  const wrapper = asRecord(value);
  const record = wrapper.plugin ? asRecord(wrapper.plugin) : wrapper;
  const embeddedPublisher = wrapper.publisher ?? record.publisher ?? record.publisherProfile;
  const embeddedRelease = wrapper.currentRelease ?? wrapper.current_release ?? record.currentRelease ?? record.current_release;
  const releases = asArray(record.releases ?? wrapper.releases).map(toRelease);
  const currentRelease = embeddedRelease ? toRelease(embeddedRelease) : releases[0] ?? null;

  return {
    id: readId(record),
    publisherId: asString(record.publisherId) || asString(record.publisher_id),
    slug: asString(record.slug),
    name: asString(record.name),
    summary: asString(record.summary),
    description: asString(record.description),
    category: asString(record.category, "other"),
    tags: stringList(record.tags),
    status: asString(record.status, "draft"),
    createdAt: readDate(record, "createdAt", "created_at"),
    updatedAt: readDate(record, "updatedAt", "updated_at"),
    publisher: embeddedPublisher ? toPublisher(embeddedPublisher) : null,
    currentRelease,
    releases,
  };
}

export function toInstallation(value: unknown): PluginInstallation {
  const record = asRecord(value);
  const embeddedPlugin = record.plugin;
  const embeddedPublisher = record.publisher;
  const embeddedRelease = record.release;

  return {
    id: readId(record),
    teamId: asString(record.teamId) || asString(record.team_id),
    pluginId: asString(record.pluginId) || asString(record.plugin_id),
    publisherId: asString(record.publisherId) || asString(record.publisher_id),
    releaseId: asString(record.releaseId) || asString(record.release_id),
    releaseVersion: asString(record.releaseVersion) || asString(record.release_version),
    manifestSha256: asString(record.manifestSha256) || asString(record.manifest_sha256),
    status: asString(record.status, "enabled"),
    installedAt: readDate(record, "installedAt", "installed_at"),
    updatedAt: readDate(record, "updatedAt", "updated_at"),
    plugin: embeddedPlugin ? toPlugin(embeddedPlugin) : null,
    publisher: embeddedPublisher ? toPublisher(embeddedPublisher) : null,
    release: embeddedRelease ? toRelease(embeddedRelease) : null,
  };
}

export function toDeployment(value: unknown): PluginDeployment {
  const record = asRecord(value);
  const selection = asRecord(record.selection);
  const embeddedPlugin = record.plugin;
  const embeddedRelease = record.release;

  return {
    id: readId(record) || asString(record.plugin_id) || asString(selection.plugin_id),
    pluginId: asString(record.pluginId) || asString(record.plugin_id) || asString(selection.plugin_id),
    releaseId: asString(record.releaseId) || asString(record.release_id),
    factoryId: asString(record.factoryId) || asString(record.factory_id) || asString(selection.factory_id),
    version: asString(record.version) || asString(selection.version),
    sha256: asString(record.sha256) || asString(selection.sha256),
    status: asString(record.status, "deployed"),
    deployedAt: readDate(record, "deployedAt", "deployed_at"),
    plugin: embeddedPlugin ? toPlugin(embeddedPlugin) : null,
    release: embeddedRelease ? toRelease(embeddedRelease) : null,
  };
}

export function toPluginList(value: unknown): CatalogPlugin[] {
  const record = asRecord(value);
  const items = Array.isArray(value)
    ? value
    : asArray(record.plugins ?? record.items ?? record.catalog);
  return items.map(toPlugin).filter((plugin) => Boolean(plugin.id || plugin.slug));
}

export function toPublisherList(value: unknown): CatalogPublisher[] {
  const record = asRecord(value);
  const items = Array.isArray(value)
    ? value
    : asArray(record.publishers ?? record.items);
  return items.map(toPublisher).filter((publisher) => Boolean(publisher.id || publisher.slug));
}

export function toInstallationList(value: unknown): PluginInstallation[] {
  const record = asRecord(value);
  const items = Array.isArray(value)
    ? value
    : asArray(record.installations ?? record.items);
  return items.map(toInstallation).filter((installation) => Boolean(installation.id || installation.pluginId));
}

export function toDeploymentList(value: unknown): PluginDeployment[] {
  const record = asRecord(value);
  const items = Array.isArray(value)
    ? value
    : asArray(record.deployments ?? record.installations ?? record.plugins ?? record.items);
  return items.map(toDeployment).filter((deployment) => Boolean(deployment.pluginId || deployment.factoryId));
}

export function toReviewQueue(value: unknown): PluginReviewQueue {
  const record = asRecord(value);
  const bareQueue = Array.isArray(value) ? value : [];
  const publishers = asArray(record.publishers ?? record.publisherQueue).map(toPublisher);
  const releases = (asArray(record.releases ?? record.releaseQueue).length ? asArray(record.releases ?? record.releaseQueue) : bareQueue).map((item) => {
    const releaseRecord = asRecord(item);
    return {
      ...toRelease(releaseRecord.release ?? releaseRecord),
      plugin: releaseRecord.plugin ? toPlugin(releaseRecord.plugin) : null,
      publisher: releaseRecord.publisher ? toPublisher(releaseRecord.publisher) : null,
    };
  });

  return { publishers, releases };
}

export function formatDate(value: string): string {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(parsed);
}

export function titleFromSlug(value: string): string {
  return value
    .split("-")
    .filter(Boolean)
    .map((part) => part.slice(0, 1).toUpperCase() + part.slice(1))
    .join(" ");
}
