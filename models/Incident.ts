import mongoose, { Schema, type Model, type Types } from "mongoose";

export const INCIDENT_STATUSES = [
  "investigating",
  "identified",
  "monitoring",
  "resolved",
] as const;
export const INCIDENT_SEVERITIES = ["minor", "major", "critical"] as const;

export type IncidentStatus = (typeof INCIDENT_STATUSES)[number];
export type IncidentSeverity = (typeof INCIDENT_SEVERITIES)[number];

const IncidentSchema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    status: { type: String, enum: INCIDENT_STATUSES, default: "investigating" },
    severity: { type: String, enum: INCIDENT_SEVERITIES, default: "minor" },
    active: { type: Boolean, default: true },
    resolvedAt: Date,
  },
  {
    collection: "incidents",
    timestamps: true,
    versionKey: "__v",
  },
);

IncidentSchema.index({ createdAt: -1 });
IncidentSchema.index({ active: 1, severity: 1, createdAt: -1 });

export type IncidentDocument = {
  _id: Types.ObjectId;
  title: string;
  description: string;
  status: IncidentStatus;
  severity: IncidentSeverity;
  active: boolean;
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
};

export const Incident: Model<IncidentDocument> =
  (mongoose.models.Incident as Model<IncidentDocument>) ??
  mongoose.model<IncidentDocument>("Incident", IncidentSchema, "incidents");

export default Incident;
