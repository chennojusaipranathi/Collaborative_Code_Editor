import mongoose from "mongoose";

const roomSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 60 },
    code: { type: String, required: true, unique: true, uppercase: true }, // join code
    mode: { type: String, enum: ["free", "classroom", "exam"], default: "free" },
    language: {
      type: String,
      enum: ["JavaScript", "TypeScript", "Python", "Java", "C++"],
      default: "JavaScript",
    },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    locked: { type: Boolean, default: false }, // classroom: teacher froze student editing
  },
  { timestamps: true }
);

export default mongoose.model("Room", roomSchema);