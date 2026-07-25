import mongoose, { Schema } from "mongoose";

export const PLUGIN_REVIEW_EVENT_TYPES = [
  "publisher_verification_requested",
  "publisher_verified",
  "publisher_rejected",
  "release_submitted",
  "release_approved",
  "release_rejected",
  "release_revoked",
  "team_plugin_installed",
  "team_plugin_uninstalled",
  "global_release_deployed",
  "global_release_removed",
] as const;

export type PluginReviewEventType = (typeof PLUGIN_REVIEW_EVENT_TYPES)[number];
export type PluginReviewSubjectType = "publisher" | "release" | "installation" | "global_deployment";

export interface IPluginReviewEvent {
  _id: mongoose.Types.ObjectId;
  subject_type: PluginReviewSubjectType;
  subject_id: mongoose.Types.ObjectId;
  publisher_id?: mongoose.Types.ObjectId;
  plugin_id?: mongoose.Types.ObjectId;
  release_id?: mongoose.Types.ObjectId;
  team_id?: mongoose.Types.ObjectId;
  actor_id: mongoose.Types.ObjectId;
  event_type: PluginReviewEventType;
  previous_status?: string;
  next_status?: string;
  note?: string;
  created_at: Date;
}

const PluginReviewEventSchema = new Schema<IPluginReviewEvent>(
  {
    subject_type: { type: String, enum: ["publisher", "release", "installation", "global_deployment"], required: true },
    subject_id: { type: Schema.Types.ObjectId, required: true, index: true },
    publisher_id: { type: Schema.Types.ObjectId, ref: "PluginPublisher", index: true },
    plugin_id: { type: Schema.Types.ObjectId, ref: "DeveloperPlugin", index: true },
    release_id: { type: Schema.Types.ObjectId, ref: "PluginRelease", index: true },
    team_id: { type: Schema.Types.ObjectId, ref: "Team", index: true },
    actor_id: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    event_type: { type: String, enum: PLUGIN_REVIEW_EVENT_TYPES, required: true },
    previous_status: { type: String, maxlength: 80 },
    next_status: { type: String, maxlength: 80 },
    note: { type: String, trim: true, maxlength: 2000 },
    created_at: { type: Date, required: true, default: Date.now },
  },
  { collection: "plugin_review_events", strict: "throw" },
);

PluginReviewEventSchema.index({ subject_type: 1, subject_id: 1, created_at: -1 });
PluginReviewEventSchema.index({ event_type: 1, created_at: -1 });

PluginReviewEventSchema.pre("save", function enforceReviewEventImmutability() {
  if (!this.isNew) {
    throw new Error("Plugin review events are append-only.");
  }
});

const PluginReviewEvent =
  (mongoose.models.PluginReviewEvent as mongoose.Model<IPluginReviewEvent> | undefined) ||
  mongoose.model<IPluginReviewEvent>("PluginReviewEvent", PluginReviewEventSchema);

export default PluginReviewEvent;
