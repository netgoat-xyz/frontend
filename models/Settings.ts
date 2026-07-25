import mongoose from "mongoose";

const AgentPluginInstallationSchema = new mongoose.Schema(
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
    config: { type: mongoose.Schema.Types.Mixed, required: true },
  },
  { _id: false, strict: "throw" },
);

const AgentPluginsSnapshotSchema = new mongoose.Schema(
  {
    installations: { type: [AgentPluginInstallationSchema], default: [] },
  },
  { _id: false, strict: "throw" },
);

const SettingsSchema = new mongoose.Schema({
  // Kept for compatibility with legacy key/value settings documents. Agent
  // configuration belongs only on the unkeyed global settings document.
  key: { type: String },
  value: { type: mongoose.Schema.Types.Mixed },

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
    enum: ["info", "warning", "error", "success", "announcement", "marketing", "rainbow", "midnight"]
  },

  // Published by the stream server to edge agents. Keep this as a mixed
  // document so newly added, non-secret agent settings survive dashboard
  // updates while targeted editor actions can update nested fields safely.
  agentConfig: { type: mongoose.Schema.Types.Mixed, default: () => ({}) },

  // This is intentionally separate from agentConfig: it is a reviewed global
  // deployment snapshot, not a side effect of team marketplace installs. The
  // stream server reads the top-level flag and the nested installations list.
  pluginsConfigured: { type: Boolean, default: false },
  plugins: {
    type: AgentPluginsSnapshotSchema,
    default: () => ({ installations: [] }),
  },

  featureFlags: [{
    key: String,
    description: String,
    isActive: { type: Boolean, default: false }, 
    percentage: { type: Number, default: 0 },
    variants: [String]
  }]
}, { timestamps: true });

export default mongoose.models.Settings || mongoose.model("Settings", SettingsSchema);
