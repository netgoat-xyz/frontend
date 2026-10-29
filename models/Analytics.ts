import mongoose, { Schema, type Model } from "mongoose";

/* -------------------------------------------------------------------------- */
/* Self-hosted analytics events                                               */
/* -------------------------------------------------------------------------- */

export const ANALYTICS_EVENT_TYPES = ["pageview", "web-vital"] as const;
export type AnalyticsEventType = (typeof ANALYTICS_EVENT_TYPES)[number];

export type AnalyticsDevice = "desktop" | "mobile" | "tablet";

const AnalyticsSchema = new Schema(
  {
    type: { type: String, enum: ANALYTICS_EVENT_TYPES, required: true, index: true },
    path: { type: String, required: true, index: true },
    visitorId: { type: String, required: true },
    sessionId: String,
    referrer: String,

    userAgent: String,
    device: { type: String, default: "desktop" },

    metricName: String,
    metricValue: Number,
    metricRating: String,

    timestamp: { type: Date, default: Date.now, index: true },
  },
  {
    collection: "analytics",
    timestamps: { createdAt: true, updatedAt: false },
    versionKey: "__v",
  },
);

AnalyticsSchema.index({ path: 1, timestamp: -1 });
AnalyticsSchema.index({ timestamp: -1, type: 1 });

export type AnalyticsDocument = {
  _id: mongoose.Types.ObjectId;
  type: AnalyticsEventType;
  path: string;
  visitorId: string;
  sessionId?: string;
  referrer?: string;
  userAgent?: string;
  device: AnalyticsDevice;
  metricName?: string;
  metricValue?: number;
  metricRating?: string;
  timestamp: Date;
  createdAt: Date;
};

export const Analytics: Model<AnalyticsDocument> =
  (mongoose.models.Analytics as Model<AnalyticsDocument>) ??
  mongoose.model<AnalyticsDocument>("Analytics", AnalyticsSchema, "analytics");

export default Analytics;
