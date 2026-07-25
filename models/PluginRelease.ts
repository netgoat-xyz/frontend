import mongoose, { Schema } from "mongoose";
import {
  BUILTIN_MIDDLEWARE_API_VERSION,
  BUILTIN_MIDDLEWARE_MANIFEST_KIND,
  MIDDLEWARE_CAPABILITIES,
  type BuiltinMiddlewareManifest,
} from "@/lib/plugin-catalog";

export type PluginReleaseStatus = "draft" | "submitted" | "approved" | "rejected" | "revoked";

export interface IPluginRelease {
  _id: mongoose.Types.ObjectId;
  plugin_id: mongoose.Types.ObjectId;
  publisher_id: mongoose.Types.ObjectId;
  version: string;
  changelog?: string;
  manifest: BuiltinMiddlewareManifest;
  manifest_sha256: string;
  /** Digest of the compiled agent descriptor, separate from manifest integrity. */
  descriptor_sha256: string;
  status: PluginReleaseStatus;
  created_by: mongoose.Types.ObjectId;
  submitted_at?: Date;
  reviewed_at?: Date;
  reviewed_by?: mongoose.Types.ObjectId;
  review_note?: string;
  created_at?: Date;
  updated_at?: Date;
}

const BuiltinMiddlewareManifestSchema = new Schema(
  {
    kind: { type: String, enum: [BUILTIN_MIDDLEWARE_MANIFEST_KIND], required: true, immutable: true },
    api_version: { type: String, enum: [BUILTIN_MIDDLEWARE_API_VERSION], required: true, immutable: true },
    factory_id: {
      type: String,
      required: true,
      immutable: true,
      trim: true,
      lowercase: true,
      maxlength: 80,
      match: /^[a-z0-9][a-z0-9._/-]{0,79}$/,
    },
    granted_capabilities: {
      type: [{ type: String, enum: MIDDLEWARE_CAPABILITIES }],
      required: true,
      immutable: true,
      default: [],
    },
    config: { type: Schema.Types.Mixed, required: true, immutable: true },
  },
  { _id: false, strict: "throw" },
);

const PluginReleaseSchema = new Schema(
  {
    plugin_id: { type: Schema.Types.ObjectId, ref: "DeveloperPlugin", required: true, immutable: true, index: true },
    publisher_id: { type: Schema.Types.ObjectId, ref: "PluginPublisher", required: true, immutable: true, index: true },
    version: { type: String, required: true, immutable: true, trim: true, maxlength: 128 },
    changelog: { type: String, immutable: true, trim: true, maxlength: 8 * 1024 },
    manifest: { type: BuiltinMiddlewareManifestSchema, required: true, immutable: true },
    manifest_sha256: { type: String, required: true, immutable: true, lowercase: true, match: /^[a-f0-9]{64}$/ },
    descriptor_sha256: { type: String, required: true, immutable: true, lowercase: true, match: /^[a-f0-9]{64}$/ },
    status: {
      type: String,
      enum: ["draft", "submitted", "approved", "rejected", "revoked"],
      required: true,
      default: "draft",
    },
    created_by: { type: Schema.Types.ObjectId, ref: "User", required: true, immutable: true },
    submitted_at: { type: Date },
    reviewed_at: { type: Date },
    reviewed_by: { type: Schema.Types.ObjectId, ref: "User" },
    review_note: { type: String, trim: true, maxlength: 2000 },
  },
  {
    collection: "plugin_releases",
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    strict: "throw",
  },
);

const immutableReleaseFields = [
  "plugin_id",
  "publisher_id",
  "version",
  "changelog",
  "manifest",
  "manifest_sha256",
  "descriptor_sha256",
  "created_by",
] as const;

PluginReleaseSchema.pre("save", function enforceReleaseImmutability() {
  if (!this.isNew) {
    for (const field of immutableReleaseFields) {
      if (this.isModified(field)) {
        throw new Error(`Plugin releases are immutable; ${field} cannot be changed.`);
      }
    }
  }
});

PluginReleaseSchema.index({ plugin_id: 1, version: 1 }, { unique: true });
PluginReleaseSchema.index({ publisher_id: 1, status: 1, created_at: -1 });

const PluginRelease =
  (mongoose.models.PluginRelease as mongoose.Model<IPluginRelease> | undefined) ||
  mongoose.model<IPluginRelease>("PluginRelease", PluginReleaseSchema);

export default PluginRelease;
