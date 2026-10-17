import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

/**
 * Better-Auth `user` collection. Field names and collection name must stay
 * compatible with the shared NetGoat database so existing accounts keep
 * working across frontend and frontend-v2.
 */
const UserSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    emailVerified: { type: Boolean, default: false },
    image: String,

    /** "user" | "admin" — managed server-side only. */
    role: { type: String, enum: ["user", "admin"], default: "user" },
    banned: { type: Boolean, default: false },
    banReason: String,
    banExpires: Date,

    experiments: { type: [String], default: [] },

    // Domain quota tracking
    domain_count: { type: Number, default: 0 },
    max_domains: { type: Number, default: 5 },

    // Aggregate stats
    total_bandwidth: { type: Number, default: 0 },
    total_requests: { type: Number, default: 0 },

    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { collection: "user", versionKey: "__v" },
);

UserSchema.index({ email: 1 }, { unique: true });

export type UserDocument = InferSchemaType<typeof UserSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const User: Model<UserDocument> =
  (mongoose.models.User as Model<UserDocument>) ??
  mongoose.model<UserDocument>("User", UserSchema);

export default User;
