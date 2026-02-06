import mongoose from "mongoose";

const SettingsSchema = new mongoose.Schema({
  siteName: { type: String, default: "NetGoat" },
  registrationEnabled: { type: Boolean, default: true },
  maintenanceMode: { type: Boolean, default: false },

  // System/Integration
  sentryEnabled: { type: Boolean, default: false },
  sentryDsn: { type: String, default: "" },

  // Features
  proEnabled: { type: Boolean, default: false },
  dnsEnabled: { type: Boolean, default: true },
  reverseProxyEnabled: { type: Boolean, default: true },

  // Limits
  userDomainLimit: { type: Number, default: 3 },
  dnsRecordLimit: { type: Number, default: 50 },
  organizationLimit: { type: Number, default: 1 },
  auditLogRetentionDays: { type: Number, default: 30 },

  // Global Banner
  globalBannerEnabled: { type: Boolean, default: false },
  globalBannerText: { type: String, default: "" },
  globalBannerVariant: { 
    type: String, 
    default: "info", 
    enum: ["info", "warning", "error", "success", "announcement", "marketing", "rainbow", "midnight"] 
  }
}, { timestamps: true });

// We will likely only have one document, but we'll query by finding the first one
export default mongoose.models.Settings || mongoose.model("Settings", SettingsSchema);
