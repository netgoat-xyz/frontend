import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

/**
 * Better-Auth `session` collection. Kept compatible with the shared database.
 */
const SessionSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    token: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    ipAddress: String,
    userAgent: String,
  },
  { collection: "session", timestamps: true, versionKey: "__v" },
);

SessionSchema.index({ userId: 1 });
SessionSchema.index({ expiresAt: 1 });

export type SessionDocument = InferSchemaType<typeof SessionSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Session: Model<SessionDocument> =
  (mongoose.models.Session as Model<SessionDocument>) ??
  mongoose.model<SessionDocument>("Session", SessionSchema);

export default Session;
