import mongoose, { Schema } from "mongoose";

export type DeveloperPluginStatus = "draft" | "published" | "suspended" | "archived";

export interface IDeveloperPlugin {
  _id: mongoose.Types.ObjectId;
  publisher_id: mongoose.Types.ObjectId;
  created_by: mongoose.Types.ObjectId;
  slug: string;
  name: string;
  summary: string;
  description?: string;
  category: string;
  tags: string[];
  status: DeveloperPluginStatus;
  current_release_id?: mongoose.Types.ObjectId;
  created_at?: Date;
  updated_at?: Date;
}

const DeveloperPluginSchema = new Schema<IDeveloperPlugin>(
  {
    publisher_id: { type: Schema.Types.ObjectId, ref: "PluginPublisher", required: true, index: true },
    created_by: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
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
    name: { type: String, required: true, trim: true, maxlength: 96 },
    summary: { type: String, required: true, trim: true, maxlength: 280 },
    description: { type: String, trim: true, maxlength: 8 * 1024 },
    category: { type: String, required: true, trim: true, lowercase: true, maxlength: 40, default: "other" },
    tags: {
      type: [{ type: String, trim: true, lowercase: true, maxlength: 32 }],
      default: [],
      validate: [(tags: string[]) => tags.length <= 12, "A plugin can have at most 12 tags."],
    },
    status: {
      type: String,
      enum: ["draft", "published", "suspended", "archived"],
      default: "draft",
      required: true,
    },
    current_release_id: { type: Schema.Types.ObjectId, ref: "PluginRelease" },
  },
  {
    collection: "developer_plugins",
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    strict: "throw",
  },
);

DeveloperPluginSchema.index({ publisher_id: 1, status: 1, created_at: -1 });
DeveloperPluginSchema.index({ status: 1, category: 1, created_at: -1 });

const DeveloperPlugin =
  (mongoose.models.DeveloperPlugin as mongoose.Model<IDeveloperPlugin> | undefined) ||
  mongoose.model<IDeveloperPlugin>("DeveloperPlugin", DeveloperPluginSchema);

export default DeveloperPlugin;
