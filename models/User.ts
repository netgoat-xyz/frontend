import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  name: String,
  email: String,
  image: String,
  role: { type: String, default: "user" },
  banned: { type: Boolean, default: false },
  
  experiments: [String],

  createdAt: Date,
  updatedAt: Date
}, { collection: "user" }); 

export default mongoose.models.User || mongoose.model("User", UserSchema);
