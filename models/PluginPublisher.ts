import mongoose, { Schema } from "mongoose";
import type { PublisherCredibility, PublisherVerificationStatus } from "@/lib/plugin-catalog";

export type PluginPublisherStatus = "active" | "suspended";

export interface IPublisherVerification {
  status: PublisherVerificationStatus;
  reviewed_at?: Date;
  reviewed_by?: mongoose.Types.ObjectId;
  note?: string;
}

export interface IPublisherCredibility extends PublisherCredibility {
  calculated_at: Date;
}

export interface IPluginPublisher {
  _id: mongoose.Types.ObjectId;
  owner_id: mongoose.Types.ObjectId;
  slug: string;
  display_name: string;
  description?: string;
  website_url?: string;
  support_url?: string;
  status: PluginPublisherStatus;
  verification: IPublisherVerification;
  credibility: IPublisherCredibility;
  created_at?: Date;
  updated_at?: Date;
}

const PublisherVerificationSchema = new Schema<IPublisherVerification>(
  {
    status: {
      type: String,
      enum: ["unverified", "pending", "verified", "rejected"],
      default: "unverified",
      required: true,
    },
    reviewed_at: { type: Date },
    reviewed_by: { type: Schema.Types.ObjectId, ref: "User" },
    note: { type: String, maxlength: 2000 },
  },
  { _id: false },
);

const PublisherCredibilitySchema = new Schema<IPublisherCredibility>(
  {
    score: { type: Number, required: true, min: 0, max: 100, default: 10 },
    base_points: { type: Number, required: true, min: 0, max: 100, default: 10 },
    verification_points: { type: Number, required: true, min: 0, max: 100, default: 0 },
    release_points: { type: Number, required: true, min: 0, max: 100, default: 0 },
    installation_points: { type: Number, required: true, min: 0, max: 100, default: 0 },
    review_penalty: { type: Number, required: true, min: 0, max: 100, default: 0 },
    calculated_at: { type: Date, required: true, default: Date.now },
  },
  { _id: false },
);

const PluginPublisherSchema = new Schema<IPluginPublisher>(
  {
    owner_id: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      minlength: 2,
      maxlength: 80,
      match: /^[a-z0-9](?:[a-z0-9-]{0,78}[a-z0-9])?$/,
    },
    display_name: { type: String, required: true, trim: true, maxlength: 96 },
    description: { type: String, trim: true, maxlength: 8 * 1024 },
    website_url: { type: String, trim: true, maxlength: 2048 },
    support_url: { type: String, trim: true, maxlength: 2048 },
    status: { type: String, enum: ["active", "suspended"], default: "active", required: true },
    verification: { type: PublisherVerificationSchema, required: true, default: () => ({}) },
    credibility: { type: PublisherCredibilitySchema, required: true, default: () => ({}) },
  },
  {
    collection: "plugin_publishers",
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    strict: "throw",
  },
);

PluginPublisherSchema.index({ status: 1, "verification.status": 1 });
PluginPublisherSchema.index({ owner_id: 1, created_at: -1 });

const PluginPublisher =
  (mongoose.models.PluginPublisher as mongoose.Model<IPluginPublisher> | undefined) ||
  mongoose.model<IPluginPublisher>("PluginPublisher", PluginPublisherSchema);

export default PluginPublisher;
