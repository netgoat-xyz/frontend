import mongoose from "mongoose";

const SettingsSchema = new mongoose.Schema({
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

  featureFlags: [{
    key: String,
    description: String,
    isActive: { type: Boolean, default: false }, 
    percentage: { type: Number, default: 0 },
    variants: [String]
  }]
}, { timestamps: true });

export default mongoose.models.Settings || mongoose.model("Settings", SettingsSchema);
