import mongoose, { Schema } from "mongoose";

export type PluginInstallationStatus = "enabled" | "disabled";

export interface IPluginInstallation {
  _id: mongoose.Types.ObjectId;
  team_id: mongoose.Types.ObjectId;
  publisher_id: mongoose.Types.ObjectId;
  plugin_id: mongoose.Types.ObjectId;
  release_id: mongoose.Types.ObjectId;
  release_version: string;
  manifest_sha256: string;
  status: PluginInstallationStatus;
  installed_by: mongoose.Types.ObjectId;
  installed_at: Date;
  updated_at?: Date;
}

const PluginInstallationSchema = new Schema<IPluginInstallation>(
  {
    team_id: { type: Schema.Types.ObjectId, ref: "Team", required: true, index: true },
    publisher_id: { type: Schema.Types.ObjectId, ref: "PluginPublisher", required: true, index: true },
    plugin_id: { type: Schema.Types.ObjectId, ref: "DeveloperPlugin", required: true, index: true },
    release_id: { type: Schema.Types.ObjectId, ref: "PluginRelease", required: true },
    release_version: { type: String, required: true, maxlength: 128 },
    manifest_sha256: { type: String, required: true, lowercase: true, match: /^[a-f0-9]{64}$/ },
    status: { type: String, enum: ["enabled", "disabled"], default: "enabled", required: true },
    installed_by: { type: Schema.Types.ObjectId, ref: "User", required: true },
    installed_at: { type: Date, required: true, default: Date.now },
  },
  {
    collection: "plugin_installations",
    timestamps: { createdAt: false, updatedAt: "updated_at" },
    strict: "throw",
  },
);

PluginInstallationSchema.index({ team_id: 1, plugin_id: 1 }, { unique: true });
PluginInstallationSchema.index({ publisher_id: 1, status: 1 });

const PluginInstallation =
  (mongoose.models.PluginInstallation as mongoose.Model<IPluginInstallation> | undefined) ||
  mongoose.model<IPluginInstallation>("PluginInstallation", PluginInstallationSchema);

export default PluginInstallation;
