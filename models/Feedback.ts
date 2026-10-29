import mongoose, { Schema, type Model, type Types } from "mongoose";

export const FEEDBACK_CATEGORIES = ["bug", "idea", "praise", "other"] as const;
export const FEEDBACK_STATUSES = ["new", "reviewed", "archived"] as const;

export type FeedbackCategory = (typeof FEEDBACK_CATEGORIES)[number];
export type FeedbackStatus = (typeof FEEDBACK_STATUSES)[number];

/**
 * User-submitted feedback. Collection and field names stay compatible with
 * the existing `feedback` collection; status transitions are now reachable
 * from the admin console.
 */
const FeedbackSchema = new Schema(
  {
    message: { type: String, required: true, maxlength: 5000 },
    category: { type: String, enum: FEEDBACK_CATEGORIES, default: "other" },
    email: { type: String, maxlength: 320 },
    userId: { type: String, index: true },
    userName: String,
    path: String,
    userAgent: String,
    status: { type: String, enum: FEEDBACK_STATUSES, default: "new" },
  },
  { collection: "feedback", timestamps: true },
);

FeedbackSchema.index({ createdAt: -1 });
FeedbackSchema.index({ status: 1, createdAt: -1 });

export type FeedbackDocument = {
  _id: Types.ObjectId;
  message: string;
  category: FeedbackCategory;
  email?: string;
  userId?: string;
  userName?: string;
  path?: string;
  userAgent?: string;
  status: FeedbackStatus;
  createdAt: Date;
  updatedAt: Date;
};

export const Feedback: Model<FeedbackDocument> =
  (mongoose.models.Feedback as Model<FeedbackDocument>) ??
  mongoose.model<FeedbackDocument>("Feedback", FeedbackSchema, "feedback");

export default Feedback;
