import mongoose from "mongoose";

const ReleaseSummarySchema = new mongoose.Schema(
  {
    cacheKey: { type: String, required: true, unique: true, index: true },
    category: { type: String, required: true },
    categoryLabel: { type: String, required: true },
    repository: { type: String, required: true },
    tagName: { type: String, required: true },
    publishedAt: { type: String, required: true },
    bodyHash: { type: String, required: true },
    model: { type: String, required: true },
    source: { type: String, enum: ["ai", "fallback"], default: "ai" },
    summary: { type: String, required: true },
  },
  {
    collection: "release_summaries",
    timestamps: true,
  },
);

export default mongoose.models.ReleaseSummary ||
  mongoose.model("ReleaseSummary", ReleaseSummarySchema);
