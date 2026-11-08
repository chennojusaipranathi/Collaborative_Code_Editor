import mongoose from "mongoose";

const fileSchema = new mongoose.Schema(
  {
    room: { type: mongoose.Schema.Types.ObjectId, ref: "Room", required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    content: { type: String, default: "", maxlength: 200000 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

// Two files in the same room cannot share a name
fileSchema.index({ room: 1, name: 1 }, { unique: true });

export default mongoose.model("File", fileSchema);