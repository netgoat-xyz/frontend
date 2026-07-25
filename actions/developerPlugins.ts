"use server";

import mongoose, { type HydratedDocument } from "mongoose";
import { headers } from "next/headers";
import { revalidatePath, revalidateTag } from "next/cache";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/mongoose";
import { isBannedSessionUser } from "@/lib/user-status";
import {
  BUILTIN_MIDDLEWARE_MANIFEST_KIND,
  calculatePublisherCredibility,
  catalogPluginId,
  deploymentSelectionFromManifest,
  hashBuiltinMiddlewareManifest,
  normalizeBuiltinMiddlewareManifest,
  normalizeCatalogSlug,
  normalizeTags,
  validateBuiltinMiddlewareManifest,
  validateDeveloperPluginInput,
  validatePublisherProfileInput,
  validateReleaseVersion,
  validateSHA256,
  type DeveloperPluginInput,
  type PluginDeploymentSelection,
  type PluginReleaseInput,
  type PublisherProfileInput,
} from "@/lib/plugin-catalog";
import Settings from "@/models/Settings";
import { Team } from "@/models/Team";
import DeveloperPlugin, { type IDeveloperPlugin } from "@/models/DeveloperPlugin";
import PluginInstallation, { type IPluginInstallation } from "@/models/PluginInstallation";
import PluginPublisher, { type IPluginPublisher } from "@/models/PluginPublisher";
import PluginRelease, { type IPluginRelease } from "@/models/PluginRelease";
import PluginReviewEvent, {
  type IPluginReviewEvent,
  type PluginReviewEventType,
  type PluginReviewSubjectType,
} from "@/models/PluginReviewEvent";

type CurrentUser = {
  id: string;
  objectId: mongoose.Types.ObjectId;
  role: string;
};

type PublisherDocument = HydratedDocument<IPluginPublisher>;
type PluginDocument = HydratedDocument<IDeveloperPlugin>;
type ReleaseDocument = HydratedDocument<IPluginRelease>;
type InstallationDocument = HydratedDocument<IPluginInstallation>;

export type UpdatePluginPublisherInput = PublisherProfileInput & { publisher_id: string };
export type UpdateDeveloperPluginInput = Omit<DeveloperPluginInput, "publisher_id"> & { plugin_id: string };
export type CreatePluginReleaseInput = PluginReleaseInput & { plugin_id: string };
export type InstallPluginForTeamInput = { team_slug: string; release_id: string };
export type SetTeamPluginInstallationEnabledInput = {
  team_slug: string;
  installation_id: string;
  enabled: boolean;
};
export type UninstallPluginForTeamInput = { team_slug: string; installation_id: string };
export type PublisherVerificationReviewInput = {
  publisher_id: string;
  decision: "verify" | "reject";
  note?: string;
};
export type PluginReleaseReviewInput = {
  release_id: string;
  decision: "approve" | "reject" | "revoke";
  note?: string;
};
export type DeployApprovedPluginReleaseInput = { release_id: string };
export type RemoveDeployedPluginReleaseInput = { plugin_id: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function serialize<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function objectId(value: unknown, label: string): mongoose.Types.ObjectId {
  if (typeof value !== "string" || !mongoose.isValidObjectId(value)) {
    throw new Error(`${label} is invalid.`);
  }
  return new mongoose.Types.ObjectId(value);
}

function normalizedNote(value: unknown): string | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value !== "string") {
    throw new Error("Review note must be text.");
  }
  const note = value.trim();
  if (note.length > 2000 || /[\u0000-\u001f\u007f]/.test(note)) {
    throw new Error("Review note is too long or contains control characters.");
  }
  return note || undefined;
}

async function requireCurrentUser(): Promise<CurrentUser> {
  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session?.user?.id;
  if (!userId || !mongoose.isValidObjectId(userId) || isBannedSessionUser(session)) {
    throw new Error("Unauthorized");
  }
  return {
    id: userId,
    objectId: new mongoose.Types.ObjectId(userId),
    role: String(session.user.role || "user"),
  };
}

async function requireAdminUser(): Promise<CurrentUser> {
  const user = await requireCurrentUser();
  if (user.role !== "admin") {
    throw new Error("Unauthorized");
  }
  return user;
}

function revalidatePluginCatalog() {
  revalidatePath("/developers");
  revalidatePath("/admin");
}

async function recordReviewEvent(input: {
  subject_type: PluginReviewSubjectType;
  subject_id: mongoose.Types.ObjectId;
  actor_id: mongoose.Types.ObjectId;
  event_type: PluginReviewEventType;
  publisher_id?: mongoose.Types.ObjectId;
  plugin_id?: mongoose.Types.ObjectId;
  release_id?: mongoose.Types.ObjectId;
  team_id?: mongoose.Types.ObjectId;
  previous_status?: string;
  next_status?: string;
  note?: string;
}) {
  await PluginReviewEvent.create(input satisfies Omit<IPluginReviewEvent, "_id" | "created_at">);
}

async function refreshPublisherCredibility(publisher: PublisherDocument) {
  const [approvedReleaseCount, activeInstallationCount, rejectedReviewCount] = await Promise.all([
    PluginRelease.countDocuments({ publisher_id: publisher._id, status: "approved" }),
    PluginInstallation.countDocuments({ publisher_id: publisher._id, status: "enabled" }),
    PluginRelease.countDocuments({ publisher_id: publisher._id, status: "rejected" }),
  ]);

  publisher.credibility = {
    ...calculatePublisherCredibility({
      verification_status: publisher.verification.status,
      approved_release_count: approvedReleaseCount,
      active_installation_count: activeInstallationCount,
      rejected_review_count: rejectedReviewCount,
      suspended: publisher.status === "suspended",
    }),
    calculated_at: new Date(),
  };
  await publisher.save();
  return publisher.credibility;
}

async function requireOwnedPublisher(publisherId: unknown, user: CurrentUser): Promise<PublisherDocument> {
  const publisher = await PluginPublisher.findOne({ _id: objectId(publisherId, "Publisher id"), owner_id: user.objectId });
  if (!publisher) {
    throw new Error("Publisher not found or you do not have access.");
  }
  return publisher;
}

async function requireOwnedPlugin(pluginId: unknown, user: CurrentUser): Promise<{
  plugin: PluginDocument;
  publisher: PublisherDocument;
}> {
  const plugin = await DeveloperPlugin.findById(objectId(pluginId, "Plugin id"));
  if (!plugin) {
    throw new Error("Plugin not found.");
  }
  const publisher = await PluginPublisher.findOne({ _id: plugin.publisher_id, owner_id: user.objectId });
  if (!publisher) {
    throw new Error("You do not have access to this plugin publisher.");
  }
  return { plugin, publisher };
}

async function requireTeamPluginManager(teamSlug: unknown, user: CurrentUser) {
  if (typeof teamSlug !== "string" || !teamSlug.trim()) {
    throw new Error("Team slug is required.");
  }
  const decodedSlug = decodeURIComponent(teamSlug);
  const resolvedSlug = decodedSlug === "@me" ? `@me-${user.id}` : decodedSlug;
  const team = await Team.findOne({ slug: resolvedSlug, active: true });
  if (!team) {
    throw new Error("Team not found.");
  }
  const canManage =
    Team.hasCapability(team, user.id, "integrations.manage") || Team.hasPermission(team, user.id, "admin");
  if (!canManage) {
    throw new Error("You need team integration management permission.");
  }
  return team;
}

async function requireTeamPluginViewer(teamSlug: unknown, user: CurrentUser) {
  if (typeof teamSlug !== "string" || !teamSlug.trim()) {
    throw new Error("Team slug is required.");
  }
  const decodedSlug = decodeURIComponent(teamSlug);
  const resolvedSlug = decodedSlug === "@me" ? `@me-${user.id}` : decodedSlug;
  const team = await Team.findOne({ slug: resolvedSlug, active: true });
  if (!team || !Team.hasPermission(team, user.id, "viewer")) {
    throw new Error("Team not found or access denied.");
  }
  return team;
}

function deploymentSelectionFromRelease(
  publisher: IPluginPublisher,
  plugin: IDeveloperPlugin,
  release: IPluginRelease,
): PluginDeploymentSelection {
  const manifest = normalizeBuiltinMiddlewareManifest(release.manifest);
  const actualManifestHash = hashBuiltinMiddlewareManifest(manifest);
  if (actualManifestHash !== release.manifest_sha256) {
    throw new Error("Plugin release manifest integrity check failed.");
  }
  if (validateSHA256(release.descriptor_sha256, "Plugin descriptor SHA-256").length > 0) {
    throw new Error("Plugin release descriptor digest is invalid.");
  }
  return deploymentSelectionFromManifest(
    catalogPluginId(publisher.slug, plugin.slug),
    release.version,
    manifest,
    release.descriptor_sha256,
  );
}

async function requireApprovedRuntimeRelease(releaseId: unknown): Promise<{
  release: ReleaseDocument;
  plugin: PluginDocument;
  publisher: PublisherDocument;
  selection: PluginDeploymentSelection;
}> {
  const release = await PluginRelease.findById(objectId(releaseId, "Release id"));
  if (!release) {
    throw new Error("Plugin release not found.");
  }
  const [plugin, publisher] = await Promise.all([
    DeveloperPlugin.findById(release.plugin_id),
    PluginPublisher.findById(release.publisher_id),
  ]);
  if (!plugin || !publisher) {
    throw new Error("Plugin release ownership is incomplete.");
  }
  if (release.status !== "approved") {
    throw new Error("Only approved plugin releases can be installed or deployed.");
  }
  if (plugin.status !== "published") {
    throw new Error("Only published plugins can be installed or deployed.");
  }
  if (publisher.status !== "active" || publisher.verification.status !== "verified") {
    throw new Error("Only active, verified publishers can deploy plugin releases.");
  }
  return { release, plugin, publisher, selection: deploymentSelectionFromRelease(publisher, plugin, release) };
}

function normalizeStoredDeploymentSelection(value: unknown): PluginDeploymentSelection | null {
  if (!isRecord(value)) return null;
  const rawPluginId = typeof value.plugin_id === "string" ? value.plugin_id : "";
  const [publisherSlug, pluginSlug, ...rest] = rawPluginId.split("/");
  if (rest.length > 0 || !publisherSlug || !pluginSlug) return null;

  try {
    const pluginId = catalogPluginId(publisherSlug, pluginSlug);
    const manifest = normalizeBuiltinMiddlewareManifest({
      kind: BUILTIN_MIDDLEWARE_MANIFEST_KIND,
      api_version: value.api_version,
      factory_id: value.factory_id,
      granted_capabilities: value.granted_capabilities,
      config: value.config,
    });
    const version = typeof value.version === "string" ? value.version : "";
    const sha256 = typeof value.sha256 === "string" ? value.sha256 : "";
    return deploymentSelectionFromManifest(pluginId, version, manifest, sha256);
  } catch {
    return null;
  }
}

function storedDeploymentSelections(value: unknown): PluginDeploymentSelection[] {
  if (!isRecord(value) || !Array.isArray(value.installations)) return [];
  const seen = new Set<string>();
  const selections: PluginDeploymentSelection[] = [];
  for (const entry of value.installations) {
    const selection = normalizeStoredDeploymentSelection(entry);
    if (!selection || seen.has(selection.plugin_id)) continue;
    seen.add(selection.plugin_id);
    selections.push(selection);
  }
  return selections;
}

async function globalPluginSettings() {
  const settings = await Settings.findOneAndUpdate(
    { key: { $exists: false } },
    { $setOnInsert: { siteName: "NetGoat", registrationEnabled: true } },
    { returnDocument: "after", upsert: true, setDefaultsOnInsert: true },
  );
  if (!settings) {
    throw new Error("Could not load global plugin settings.");
  }
  return settings;
}

async function decorateGlobalDeployments(selections: PluginDeploymentSelection[]) {
  if (selections.length === 0) return [];
  const requested = selections.map((selection) => {
    const [publisherSlug, pluginSlug] = selection.plugin_id.split("/");
    return { publisherSlug, pluginSlug };
  });
  const publisherSlugs = [...new Set(requested.map((item) => item.publisherSlug))];
  const pluginSlugs = [...new Set(requested.map((item) => item.pluginSlug))];
  const publishers = await PluginPublisher.find({ slug: { $in: publisherSlugs } }).lean();
  const publisherBySlug = new Map(publishers.map((publisher) => [publisher.slug, publisher]));
  const plugins = await DeveloperPlugin.find({
    publisher_id: { $in: publishers.map((publisher) => publisher._id) },
    slug: { $in: pluginSlugs },
  }).lean();
  const pluginByCatalogId = new Map(
    plugins.flatMap((plugin) => {
      const publisher = publishers.find((candidate) => candidate._id.toString() === plugin.publisher_id.toString());
      return publisher ? [[catalogPluginId(publisher.slug, plugin.slug), plugin] as const] : [];
    }),
  );
  const releases = await PluginRelease.find({
    plugin_id: { $in: plugins.map((plugin) => plugin._id) },
    status: "approved",
  })
    .select("_id plugin_id publisher_id version changelog manifest manifest_sha256 descriptor_sha256 status review_note submitted_at reviewed_at created_at")
    .lean();

  return selections.map((selection) => {
    const plugin = pluginByCatalogId.get(selection.plugin_id) || null;
    const [publisherSlug] = selection.plugin_id.split("/");
    const publisher = publisherBySlug.get(publisherSlug) || null;
    const release = plugin
      ? releases.find(
          (candidate) =>
            candidate.plugin_id.toString() === plugin._id.toString() &&
            candidate.version === selection.version &&
            candidate.descriptor_sha256 === selection.sha256,
        ) || null
      : null;
    return {
      ...selection,
      release_id: release?._id.toString(),
      plugin,
      publisher,
      release,
    };
  });
}

export async function createPluginPublisher(input: PublisherProfileInput) {
  const user = await requireCurrentUser();
  const errors = validatePublisherProfileInput(input);
  if (errors.length > 0) throw new Error(errors.join(" "));
  await dbConnect();

  const slug = normalizeCatalogSlug(input.slug);
  const existing = await PluginPublisher.findOne({ slug });
  if (existing) {
    throw new Error("That publisher slug is already in use.");
  }

  const publisher = await PluginPublisher.create({
    owner_id: user.objectId,
    slug,
    display_name: input.display_name.trim(),
    description: input.description?.trim() || undefined,
    website_url: input.website_url?.trim() || undefined,
    support_url: input.support_url?.trim() || undefined,
    status: "active",
    verification: { status: "unverified" },
    credibility: {
      ...calculatePublisherCredibility({
        verification_status: "unverified",
        approved_release_count: 0,
        active_installation_count: 0,
        rejected_review_count: 0,
      }),
      calculated_at: new Date(),
    },
  });
  revalidatePluginCatalog();
  return serialize(publisher.toObject());
}

export async function updatePluginPublisher(input: UpdatePluginPublisherInput) {
  const user = await requireCurrentUser();
  const errors = validatePublisherProfileInput(input);
  if (errors.length > 0) throw new Error(errors.join(" "));
  await dbConnect();

  const publisher = await requireOwnedPublisher(input.publisher_id, user);
  const slug = normalizeCatalogSlug(input.slug);
  if (slug !== publisher.slug) {
    const hasPlugins = await DeveloperPlugin.exists({ publisher_id: publisher._id });
    if (hasPlugins) {
      throw new Error("Publisher slug is immutable after creating plugins because it is part of the agent plugin identity.");
    }
  }
  const collision = await PluginPublisher.findOne({ slug, _id: { $ne: publisher._id } });
  if (collision) {
    throw new Error("That publisher slug is already in use.");
  }
  publisher.slug = slug;
  publisher.display_name = input.display_name.trim();
  publisher.description = input.description?.trim() || undefined;
  publisher.website_url = input.website_url?.trim() || undefined;
  publisher.support_url = input.support_url?.trim() || undefined;
  await publisher.save();
  revalidatePluginCatalog();
  return serialize(publisher.toObject());
}

export async function listMyPluginPublishers() {
  const user = await requireCurrentUser();
  await dbConnect();
  const publishers = await PluginPublisher.find({ owner_id: user.objectId }).sort({ created_at: -1 }).lean();
  return serialize(publishers);
}

export async function requestPluginPublisherVerification(input: { publisher_id: string; note?: string }) {
  const user = await requireCurrentUser();
  await dbConnect();
  const publisher = await requireOwnedPublisher(input.publisher_id, user);
  if (publisher.status !== "active") {
    throw new Error("Suspended publishers cannot request verification.");
  }
  if (publisher.verification.status === "verified") {
    throw new Error("This publisher is already verified.");
  }
  const previousStatus = publisher.verification.status;
  const note = normalizedNote(input.note);
  publisher.verification.status = "pending";
  publisher.verification.reviewed_at = undefined;
  publisher.verification.reviewed_by = undefined;
  publisher.verification.note = note;
  await refreshPublisherCredibility(publisher);
  await recordReviewEvent({
    subject_type: "publisher",
    subject_id: publisher._id,
    publisher_id: publisher._id,
    actor_id: user.objectId,
    event_type: "publisher_verification_requested",
    previous_status: previousStatus,
    next_status: "pending",
    note,
  });
  revalidatePluginCatalog();
  return serialize(publisher.toObject());
}

export async function createDeveloperPlugin(input: DeveloperPluginInput) {
  const user = await requireCurrentUser();
  const errors = validateDeveloperPluginInput(input);
  if (errors.length > 0) throw new Error(errors.join(" "));
  await dbConnect();

  const publisher = await requireOwnedPublisher(input.publisher_id, user);
  if (publisher.status !== "active") {
    throw new Error("Suspended publishers cannot create plugins.");
  }
  const slug = normalizeCatalogSlug(input.slug);
  catalogPluginId(publisher.slug, slug);
  const collision = await DeveloperPlugin.findOne({ slug });
  if (collision) {
    throw new Error("That plugin slug is already in use.");
  }
  const plugin = await DeveloperPlugin.create({
    publisher_id: publisher._id,
    created_by: user.objectId,
    slug,
    name: input.name.trim(),
    summary: input.summary.trim(),
    description: input.description?.trim() || undefined,
    category: input.category?.trim().toLowerCase() || "other",
    tags: normalizeTags(input.tags),
    status: "draft",
  });
  revalidatePluginCatalog();
  return serialize(plugin.toObject());
}

export async function updateDeveloperPlugin(input: UpdateDeveloperPluginInput) {
  const user = await requireCurrentUser();
  const errors = validateDeveloperPluginInput(input);
  if (errors.length > 0) throw new Error(errors.join(" "));
  await dbConnect();

  const { plugin, publisher } = await requireOwnedPlugin(input.plugin_id, user);
  if (publisher.status !== "active") {
    throw new Error("Suspended publishers cannot update plugins.");
  }
  const slug = normalizeCatalogSlug(input.slug);
  if (slug !== plugin.slug) {
    const hasReleases = await PluginRelease.exists({ plugin_id: plugin._id });
    if (hasReleases) {
      throw new Error("Plugin slug is immutable after its first release because it is part of the agent plugin identity.");
    }
  }
  const collision = await DeveloperPlugin.findOne({ slug, _id: { $ne: plugin._id } });
  if (collision) {
    throw new Error("That plugin slug is already in use.");
  }
  catalogPluginId(publisher.slug, slug);
  plugin.slug = slug;
  plugin.name = input.name.trim();
  plugin.summary = input.summary.trim();
  plugin.description = input.description?.trim() || undefined;
  plugin.category = input.category?.trim().toLowerCase() || "other";
  plugin.tags = normalizeTags(input.tags);
  await plugin.save();
  revalidatePluginCatalog();
  return serialize(plugin.toObject());
}

export async function listMyDeveloperPlugins() {
  const user = await requireCurrentUser();
  await dbConnect();
  const publishers = await PluginPublisher.find({ owner_id: user.objectId }).select("_id").lean();
  const publisherIds = publishers.map((publisher) => publisher._id);
  if (publisherIds.length === 0) return [];
  const plugins = await DeveloperPlugin.find({ publisher_id: { $in: publisherIds } })
    .sort({ created_at: -1 })
    .lean();
  const releases = await PluginRelease.find({ plugin_id: { $in: plugins.map((plugin) => plugin._id) } })
    .sort({ created_at: -1 })
    .lean();
  return serialize(
    plugins.map((plugin) => ({
      ...plugin,
      releases: releases.filter((release) => release.plugin_id.toString() === plugin._id.toString()),
    })),
  );
}

export async function createPluginRelease(input: CreatePluginReleaseInput) {
  const user = await requireCurrentUser();
  const versionErrors = validateReleaseVersion(input.version);
  const manifestErrors = validateBuiltinMiddlewareManifest(input.manifest);
  const descriptorErrors = validateSHA256(input.descriptor_sha256, "Plugin descriptor SHA-256");
  const changelog = input.changelog?.trim() || undefined;
  if (changelog && (changelog.length > 8 * 1024 || /[\u0000-\u001f\u007f]/.test(changelog))) {
    throw new Error("Release changelog is too long or contains control characters.");
  }
  if (versionErrors.length > 0 || manifestErrors.length > 0 || descriptorErrors.length > 0) {
    throw new Error([...versionErrors, ...manifestErrors, ...descriptorErrors].join(" "));
  }
  await dbConnect();

  const { plugin, publisher } = await requireOwnedPlugin(input.plugin_id, user);
  if (publisher.status !== "active") {
    throw new Error("Suspended publishers cannot create releases.");
  }
  const version = input.version.trim();
  const existing = await PluginRelease.findOne({ plugin_id: plugin._id, version });
  if (existing) {
    throw new Error("This plugin version already exists and releases are immutable.");
  }
  const manifest = normalizeBuiltinMiddlewareManifest(input.manifest);
  const release = await PluginRelease.create({
    plugin_id: plugin._id,
    publisher_id: publisher._id,
    version,
    changelog,
    manifest,
    manifest_sha256: hashBuiltinMiddlewareManifest(manifest),
    descriptor_sha256: input.descriptor_sha256.trim().toLowerCase(),
    status: "draft",
    created_by: user.objectId,
  });
  revalidatePluginCatalog();
  return serialize(release.toObject());
}

export async function submitPluginRelease(input: { release_id: string }) {
  const user = await requireCurrentUser();
  await dbConnect();
  const release = await PluginRelease.findById(objectId(input.release_id, "Release id"));
  if (!release) throw new Error("Plugin release not found.");
  const publisher = await PluginPublisher.findOne({ _id: release.publisher_id, owner_id: user.objectId });
  if (!publisher) throw new Error("You do not have access to this plugin release.");
  if (publisher.status !== "active") throw new Error("Suspended publishers cannot submit releases.");
  if (release.status !== "draft" && release.status !== "rejected") {
    throw new Error("Only draft or rejected releases can be submitted for review.");
  }
  const previousStatus = release.status;
  release.status = "submitted";
  release.submitted_at = new Date();
  release.reviewed_at = undefined;
  release.reviewed_by = undefined;
  release.review_note = undefined;
  await release.save();
  await recordReviewEvent({
    subject_type: "release",
    subject_id: release._id,
    publisher_id: release.publisher_id,
    plugin_id: release.plugin_id,
    release_id: release._id,
    actor_id: user.objectId,
    event_type: "release_submitted",
    previous_status: previousStatus,
    next_status: "submitted",
  });
  revalidatePluginCatalog();
  return serialize(release.toObject());
}

export async function listDeveloperPluginCatalog() {
  await dbConnect();
  const plugins = await DeveloperPlugin.find({ status: "published" }).sort({ created_at: -1 }).lean();
  if (plugins.length === 0) return [];
  const publisherIds = [...new Set(plugins.map((plugin) => plugin.publisher_id.toString()))].map(
    (id) => new mongoose.Types.ObjectId(id),
  );
  const publishers = await PluginPublisher.find({
    _id: { $in: publisherIds },
    status: "active",
    "verification.status": "verified",
  })
    .select("_id slug display_name description website_url support_url verification credibility")
    .lean();
  const publisherById = new Map(publishers.map((publisher) => [publisher._id.toString(), publisher]));
  const currentReleaseIds = plugins
    .map((plugin) => plugin.current_release_id)
    .filter((releaseId): releaseId is mongoose.Types.ObjectId => Boolean(releaseId));
  const releases = await PluginRelease.find({ _id: { $in: currentReleaseIds }, status: "approved" })
    .select("_id plugin_id version status manifest manifest_sha256 descriptor_sha256 created_at")
    .lean();
  const releaseById = new Map(releases.map((release) => [release._id.toString(), release]));

  return serialize(
    plugins.flatMap((plugin) => {
      const publisher = publisherById.get(plugin.publisher_id.toString());
      const release = plugin.current_release_id ? releaseById.get(plugin.current_release_id.toString()) : undefined;
      if (!publisher || !release) return [];
      return [{ plugin, publisher, current_release: release }];
    }),
  );
}

export async function listTeamPluginInstallations(input: { team_slug: string }) {
  const user = await requireCurrentUser();
  await dbConnect();
  const team = await requireTeamPluginViewer(input.team_slug, user);
  const installations = await PluginInstallation.find({ team_id: team._id }).sort({ installed_at: -1 }).lean();
  if (installations.length === 0) return [];
  const [plugins, publishers, releases] = await Promise.all([
    DeveloperPlugin.find({ _id: { $in: installations.map((installation) => installation.plugin_id) } }).lean(),
    PluginPublisher.find({ _id: { $in: installations.map((installation) => installation.publisher_id) } }).lean(),
    PluginRelease.find({ _id: { $in: installations.map((installation) => installation.release_id) } }).lean(),
  ]);
  const pluginById = new Map(plugins.map((plugin) => [plugin._id.toString(), plugin]));
  const publisherById = new Map(publishers.map((publisher) => [publisher._id.toString(), publisher]));
  const releaseById = new Map(releases.map((release) => [release._id.toString(), release]));
  return serialize(
    installations.map((installation) => ({
      ...installation,
      plugin: pluginById.get(installation.plugin_id.toString()) || null,
      publisher: publisherById.get(installation.publisher_id.toString()) || null,
      release: releaseById.get(installation.release_id.toString()) || null,
    })),
  );
}

export async function installPluginForTeam(input: InstallPluginForTeamInput) {
  const user = await requireCurrentUser();
  await dbConnect();
  const team = await requireTeamPluginManager(input.team_slug, user);
  const { release, plugin, publisher } = await requireApprovedRuntimeRelease(input.release_id);
  const installation = (await PluginInstallation.findOneAndUpdate(
    { team_id: team._id, plugin_id: plugin._id },
    {
      $set: {
        publisher_id: publisher._id,
        release_id: release._id,
        release_version: release.version,
        manifest_sha256: release.manifest_sha256,
        status: "enabled",
        installed_by: user.objectId,
        installed_at: new Date(),
      },
    },
    { returnDocument: "after", upsert: true, setDefaultsOnInsert: true },
  )) as InstallationDocument | null;
  if (!installation) throw new Error("Could not install plugin for this team.");
  await recordReviewEvent({
    subject_type: "installation",
    subject_id: installation._id,
    publisher_id: publisher._id,
    plugin_id: plugin._id,
    release_id: release._id,
    team_id: team._id,
    actor_id: user.objectId,
    event_type: "team_plugin_installed",
    next_status: "enabled",
  });
  await refreshPublisherCredibility(publisher);
  revalidatePluginCatalog();
  revalidatePath(`/dashboard/${team.slug}`);
  return serialize(installation.toObject());
}

export async function setTeamPluginInstallationEnabled(input: SetTeamPluginInstallationEnabledInput) {
  const user = await requireCurrentUser();
  if (typeof input.enabled !== "boolean") throw new Error("Plugin enabled must be true or false.");
  await dbConnect();
  const team = await requireTeamPluginManager(input.team_slug, user);
  const installation = await PluginInstallation.findOne({
    _id: objectId(input.installation_id, "Plugin installation id"),
    team_id: team._id,
  });
  if (!installation) throw new Error("Plugin installation not found.");
  if (input.enabled) {
    await requireApprovedRuntimeRelease(installation.release_id.toString());
  }
  installation.status = input.enabled ? "enabled" : "disabled";
  await installation.save();
  const publisher = await PluginPublisher.findById(installation.publisher_id);
  if (publisher) await refreshPublisherCredibility(publisher);
  revalidatePluginCatalog();
  revalidatePath(`/dashboard/${team.slug}`);
  return serialize(installation.toObject());
}

export async function uninstallPluginForTeam(input: UninstallPluginForTeamInput) {
  const user = await requireCurrentUser();
  await dbConnect();
  const team = await requireTeamPluginManager(input.team_slug, user);
  const installation = await PluginInstallation.findOne({
    _id: objectId(input.installation_id, "Plugin installation id"),
    team_id: team._id,
  });
  if (!installation) throw new Error("Plugin installation not found.");
  await recordReviewEvent({
    subject_type: "installation",
    subject_id: installation._id,
    publisher_id: installation.publisher_id,
    plugin_id: installation.plugin_id,
    release_id: installation.release_id,
    team_id: team._id,
    actor_id: user.objectId,
    event_type: "team_plugin_uninstalled",
    previous_status: installation.status,
    next_status: "uninstalled",
  });
  await PluginInstallation.deleteOne({ _id: installation._id });
  const publisher = await PluginPublisher.findById(installation.publisher_id);
  if (publisher) await refreshPublisherCredibility(publisher);
  revalidatePluginCatalog();
  revalidatePath(`/dashboard/${team.slug}`);
  return { success: true };
}

export async function listPluginReviewQueue() {
  await requireAdminUser();
  await dbConnect();
  const [releases, pendingPublishers] = await Promise.all([
    PluginRelease.find({ status: "submitted" }).sort({ submitted_at: 1 }).lean(),
    PluginPublisher.find({ status: "active", "verification.status": "pending" })
      .select("_id slug display_name description website_url support_url status verification credibility created_at")
      .sort({ updated_at: 1 })
      .lean(),
  ]);
  if (releases.length === 0) {
    return serialize({ publishers: pendingPublishers, releases: [] });
  }
  const [plugins, publishers] = await Promise.all([
    DeveloperPlugin.find({ _id: { $in: releases.map((release) => release.plugin_id) } })
      .select("_id slug name summary status publisher_id")
      .lean(),
    PluginPublisher.find({ _id: { $in: releases.map((release) => release.publisher_id) } })
      .select("_id slug display_name status verification credibility")
      .lean(),
  ]);
  const pluginById = new Map(plugins.map((plugin) => [plugin._id.toString(), plugin]));
  const publisherById = new Map(publishers.map((publisher) => [publisher._id.toString(), publisher]));
  return serialize({
    publishers: pendingPublishers,
    releases: releases.map((release) => ({
      release,
      plugin: pluginById.get(release.plugin_id.toString()) || null,
      publisher: publisherById.get(release.publisher_id.toString()) || null,
    })),
  });
}

export async function reviewPluginPublisherVerification(input: PublisherVerificationReviewInput) {
  const admin = await requireAdminUser();
  await dbConnect();
  const publisher = await PluginPublisher.findById(objectId(input.publisher_id, "Publisher id"));
  if (!publisher) throw new Error("Publisher not found.");
  if (input.decision !== "verify" && input.decision !== "reject") {
    throw new Error("Publisher verification decision is invalid.");
  }
  const previousStatus = publisher.verification.status;
  const nextStatus = input.decision === "verify" ? "verified" : "rejected";
  const note = normalizedNote(input.note);
  publisher.verification.status = nextStatus;
  publisher.verification.reviewed_at = new Date();
  publisher.verification.reviewed_by = admin.objectId;
  publisher.verification.note = note;
  await refreshPublisherCredibility(publisher);
  await recordReviewEvent({
    subject_type: "publisher",
    subject_id: publisher._id,
    publisher_id: publisher._id,
    actor_id: admin.objectId,
    event_type: nextStatus === "verified" ? "publisher_verified" : "publisher_rejected",
    previous_status: previousStatus,
    next_status: nextStatus,
    note,
  });

  // A rejected publisher must not leave a previously approved global runtime
  // selection behind. Team installs remain visible but cannot be re-enabled.
  if (nextStatus !== "verified") {
    const plugins = await DeveloperPlugin.find({ publisher_id: publisher._id }).select("slug").lean();
    const pluginIds = new Set(plugins.map((plugin) => catalogPluginId(publisher.slug, plugin.slug)));
    const settings = await globalPluginSettings();
    const selections = storedDeploymentSelections(settings.plugins).filter(
      (selection) => !pluginIds.has(selection.plugin_id),
    );
    settings.pluginsConfigured = true;
    settings.plugins = { installations: selections };
    await settings.save();
    revalidateTag("public-settings", "max");
  }
  revalidatePluginCatalog();
  return serialize(publisher.toObject());
}

export async function reviewPluginRelease(input: PluginReleaseReviewInput) {
  const admin = await requireAdminUser();
  await dbConnect();
  const release = await PluginRelease.findById(objectId(input.release_id, "Release id"));
  if (!release) throw new Error("Plugin release not found.");
  const [plugin, publisher] = await Promise.all([
    DeveloperPlugin.findById(release.plugin_id),
    PluginPublisher.findById(release.publisher_id),
  ]);
  if (!plugin || !publisher) throw new Error("Plugin release ownership is incomplete.");
  const note = normalizedNote(input.note);
  const previousStatus = release.status;

  if (input.decision === "approve") {
    if (release.status !== "submitted") throw new Error("Only submitted releases can be approved.");
    if (publisher.status !== "active" || publisher.verification.status !== "verified") {
      throw new Error("Only releases from active, verified publishers can be approved.");
    }
    deploymentSelectionFromRelease(publisher, plugin, release);
    release.status = "approved";
    plugin.status = "published";
    plugin.current_release_id = release._id;
    await Promise.all([release.save(), plugin.save()]);
  } else if (input.decision === "reject") {
    if (release.status !== "submitted") throw new Error("Only submitted releases can be rejected.");
    release.status = "rejected";
    await release.save();
  } else if (input.decision === "revoke") {
    if (release.status !== "approved") throw new Error("Only approved releases can be revoked.");
    release.status = "revoked";
    await release.save();
    if (plugin.current_release_id?.toString() === release._id.toString()) {
      const fallback = await PluginRelease.findOne({ plugin_id: plugin._id, status: "approved", _id: { $ne: release._id } })
        .sort({ created_at: -1 });
      plugin.current_release_id = fallback?._id;
      plugin.status = fallback ? "published" : "draft";
      await plugin.save();
    }
    const settings = await globalPluginSettings();
    const pluginId = catalogPluginId(publisher.slug, plugin.slug);
    const installations = storedDeploymentSelections(settings.plugins).filter(
      (installation) => installation.plugin_id !== pluginId,
    );
    settings.pluginsConfigured = true;
    settings.plugins = { installations };
    await settings.save();
    revalidateTag("public-settings", "max");
  } else {
    throw new Error("Plugin release review decision is invalid.");
  }

  release.reviewed_at = new Date();
  release.reviewed_by = admin.objectId;
  release.review_note = note;
  await release.save();
  await recordReviewEvent({
    subject_type: "release",
    subject_id: release._id,
    publisher_id: publisher._id,
    plugin_id: plugin._id,
    release_id: release._id,
    actor_id: admin.objectId,
    event_type:
      input.decision === "approve"
        ? "release_approved"
        : input.decision === "reject"
          ? "release_rejected"
          : "release_revoked",
    previous_status: previousStatus,
    next_status: release.status,
    note,
  });
  await refreshPublisherCredibility(publisher);
  revalidatePluginCatalog();
  return serialize(release.toObject());
}

export async function deployApprovedPluginRelease(input: DeployApprovedPluginReleaseInput) {
  const admin = await requireAdminUser();
  await dbConnect();
  const { release, plugin, publisher, selection } = await requireApprovedRuntimeRelease(input.release_id);
  const settings = await globalPluginSettings();
  const installations = storedDeploymentSelections(settings.plugins);
  const existingIndex = installations.findIndex((installation) => installation.plugin_id === selection.plugin_id);
  if (existingIndex >= 0) {
    installations[existingIndex] = selection;
  } else {
    installations.push(selection);
  }
  settings.pluginsConfigured = true;
  settings.plugins = { installations };
  await settings.save();
  await recordReviewEvent({
    subject_type: "global_deployment",
    subject_id: release._id,
    publisher_id: publisher._id,
    plugin_id: plugin._id,
    release_id: release._id,
    actor_id: admin.objectId,
    event_type: "global_release_deployed",
    next_status: "deployed",
  });
  revalidateTag("public-settings", "max");
  revalidatePluginCatalog();
  return serialize({ configured: true, installations });
}

export async function removeDeployedPluginRelease(input: RemoveDeployedPluginReleaseInput) {
  const admin = await requireAdminUser();
  await dbConnect();
  if (typeof input.plugin_id !== "string") throw new Error("Plugin id is required.");
  const [publisherSlug, pluginSlug, ...rest] = input.plugin_id.split("/");
  if (!publisherSlug || !pluginSlug || rest.length > 0) throw new Error("Plugin id must use publisher/plugin format.");
  const pluginId = catalogPluginId(publisherSlug, pluginSlug);
  const settings = await globalPluginSettings();
  const installations = storedDeploymentSelections(settings.plugins);
  const remaining = installations.filter((installation) => installation.plugin_id !== pluginId);
  if (remaining.length === installations.length) {
    throw new Error("That plugin is not globally deployed.");
  }
  settings.pluginsConfigured = true;
  settings.plugins = { installations: remaining };
  await settings.save();
  await recordReviewEvent({
    subject_type: "global_deployment",
    subject_id: new mongoose.Types.ObjectId(),
    actor_id: admin.objectId,
    event_type: "global_release_removed",
    previous_status: "deployed",
    next_status: "removed",
    note: pluginId,
  });
  revalidateTag("public-settings", "max");
  revalidatePluginCatalog();
  return serialize({ configured: true, installations: remaining });
}

export async function getDeployedPluginSnapshot() {
  await requireAdminUser();
  await dbConnect();
  const settings = await globalPluginSettings();
  const installations = await decorateGlobalDeployments(storedDeploymentSelections(settings.plugins));
  return serialize({
    configured: settings.pluginsConfigured === true,
    installations,
  });
}
