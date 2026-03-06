import mongoose from "mongoose";

const AnalyticsSchema = new mongoose.Schema({
  type: { type: String, enum: ["pageview", "web-vital"], required: true },

  path: { type: String, required: true },
  visitorId: { type: String, required: true },
  sessionId: { type: String },
  referrer: { type: String },
  
  userAgent: String,
  device: { type: String, default: "desktop" }, 
  metricName: String,
  metricValue: Number,
  metricRating: String,

  timestamp: { type: Date, default: Date.now },
}, { 
  timestamps: { createdAt: true, updatedAt: false }
});

AnalyticsSchema.index({ timestamp: -1 });
AnalyticsSchema.index({ path: 1 });
AnalyticsSchema.index({ type: 1 });

export default mongoose.models.Analytics || mongoose.model("Analytics", AnalyticsSchema);
