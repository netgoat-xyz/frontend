import mongoose from "mongoose";

const SessionSchema = new mongoose.Schema({
  userId: String,
  expiresAt: Date,
  token: String,
  createdAt: Date,
  updatedAt: Date,
  ipAddress: String,
  userAgent: String
}, { collection: "session" }); // better-auth uses 'session' by default

export default mongoose.models.Session || mongoose.model("Session", SessionSchema);
