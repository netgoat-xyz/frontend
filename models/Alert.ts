import mongoose, { Schema, type Model, type Types } from "mongoose";

const AlertSchema = new Schema(
  {
    title: { type: String, required: true },
    body: { type: String, required: true },
    variant: { type: String, enum: ["red", "yellow", "blue"], default: "blue" },
    actionText: { type: String, default: "Dismiss" },
    active: { type: Boolean, default: true },
  },
  { collection: "alerts", timestamps: { createdAt: true, updatedAt: false } },
);

AlertSchema.index({ active: 1, createdAt: -1 });

export type PlatformAlert = {
  _id: Types.ObjectId;
  title: string;
  body: string;
  variant: "red" | "yellow" | "blue";
  actionText: string;
  active: boolean;
  createdAt: Date;
};

export const Alert: Model<PlatformAlert> =
  (mongoose.models.Alert as Model<PlatformAlert>) ??
  mongoose.model<PlatformAlert>("Alert", AlertSchema, "alerts");

export default Alert;
