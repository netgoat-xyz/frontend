import mongoose from "mongoose";

const IncidentSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  status: { 
    type: String, 
    enum: ["investigating", "identified", "monitoring", "resolved"], 
    default: "investigating",
    required: true 
  },
  severity: {
    type: String,
    enum: ["minor", "major", "critical"],
    default: "minor",
  },
  active: { type: Boolean, default: true },
  resolvedAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { collection: "incidents" });

export default mongoose.models.Incident || mongoose.model("Incident", IncidentSchema);
