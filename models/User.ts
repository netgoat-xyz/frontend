import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  name: String,
  email: String,
  image: String,
  role: { type: String, default: "user" },
  banned: { type: Boolean, default: false },
  
  // Experiments / Feature Flags user overrides
  experiments: [String],

  createdAt: Date,
  updatedAt: Date
}, { collection: "user" }); // better-auth uses 'user' by default

export default mongoose.models.User || mongoose.model("User", UserSchema);
