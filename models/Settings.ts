import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const AgentPluginInstallationSchema = new Schema(
  {
    plugin_id: { type: String, required: true, maxlength: 128 },
    factory_id: { type: String, required: true, maxlength: 80 },
    version: { type: String, required: true, maxlength: 128 },
    sha256: { type: String, required: true, lowercase: true, match: /^[a-f0-9]{64}$/ },
    api_version: { type: String, required: true, enum: ["netgoat.dev/middleware/v1"] },
    granted_capabilities: {
      type: [{ type: String, enum: ["request.read", "route.read", "response.write"] }],
      default: [],
    },
    config: { type: Schema.Types.Mixed, required: true },
  },
  { _id: false, strict: "throw" },
);

const AgentPluginsSnapshotSchema = new Schema(
  {
    installations: { type: [AgentPluginInstallationSchema], default: [] },
  },
  { _id: false, strict: "throw" },
);

const FeatureFlagSchema = new Schema(
  {
    key: String,
    description: String,
    isActive: { type: Boolean, default: false },
    percentage: { type: Number, default: 0 },
    variants: [String],
  },
  { _id: false },
);

/**
 * Global settings document. A single unkeyed document holds platform-wide
 * configuration; the `key`/`value` pair is kept for legacy compatibility.
 */
const SettingsSchema = new Schema(
  {
    key: { type: String },
    value: { type: Schema.Types.Mixed },

    siteName: { type: String, default: "NetGoat" },
    registrationEnabled: { type: Boolean, default: true },
    maintenanceMode: { type: Boolean, default: false },

    sentryEnabled: { type: Boolean, default: false },
    sentryDsn: { type: String, default: "" },

    proEnabled: { type: Boolean, default: false },
    dnsEnabled: { type: Boolean, default: true },
    reverseProxyEnabled: { type: Boolean, default: true },

    userDomainLimit: { type: Number, default: 3 },
    dnsRecordLimit: { type: Number, default: 50 },
    organizationLimit: { type: Number, default: 1 },
    auditLogRetentionDays: { type: Number, default: 30 },

    globalBannerEnabled: { type: Boolean, default: false },
    globalBannerText: { type: String, default: "" },
    globalBannerVariant: {
      type: String,
      default: "info",
      enum: [
        "info",
        "warning",
        "error",
        "success",
        "announcement",
        "marketing",
        "rainbow",
        "midnight",
      ],
    },

    /** Mixed document published to edge agents; non-secret by design. */
    agentConfig: { type: Schema.Types.Mixed, default: () => ({}) },

    pluginsConfigured: { type: Boolean, default: false },
    plugins: {
      type: AgentPluginsSnapshotSchema,
      default: () => ({ installations: [] }),
    },

    featureFlags: { type: [FeatureFlagSchema], default: [] },
  },
  { timestamps: true },
);

export type SettingsDocument = InferSchemaType<typeof SettingsSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Settings: Model<SettingsDocument> =
  (mongoose.models.Settings as Model<SettingsDocument>) ??
  mongoose.model<SettingsDocument>("Settings", SettingsSchema);

export default Settings;
