import mongoose from "mongoose";

const AlertSchema = new mongoose.Schema({
  title: { type: String, required: true },
  body: { type: String, required: true },
  variant: { 
    type: String, 
    enum: ["red", "yellow", "blue"], 
    default: "blue",
    required: true 
  },
  actionText: { type: String, default: "Dismiss" },
  active: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
}, { collection: "alerts" });

export default mongoose.models.Alert || mongoose.model("Alert", AlertSchema);
