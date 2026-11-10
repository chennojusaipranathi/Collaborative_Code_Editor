import mongoose from "mongoose";

const snapshotSchema = new mongoose.Schema(
  {
    room: { type: mongoose.Schema.Types.ObjectId, ref: "Room", required: true },
    file: { type: mongoose.Schema.Types.ObjectId, ref: "File", required: true },
    fileName: { type: String, required: true },
    label: { type: String, required: true, trim: true, maxlength: 120 },
    type: { type: String, enum: ["auto", "manual", "backup"], required: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    authorName: { type: String, required: true },
    content: { type: String, default: "", maxlength: 200000 },
  },
  { timestamps: true }
);

snapshotSchema.index({ file: 1, createdAt: -1 });

export default mongoose.model("VersionSnapshot", snapshotSchema);