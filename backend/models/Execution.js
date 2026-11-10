import mongoose from "mongoose";

const executionSchema = new mongoose.Schema(
  {
    room: { type: mongoose.Schema.Types.ObjectId, ref: "Room", required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    userName: { type: String, required: true },
    fileName: { type: String, required: true },
    language: { type: String, required: true },
    status: { type: String, required: true },
    stdout: { type: String, default: "" },
    stderr: { type: String, default: "" },
    compileOutput: { type: String, default: "" },
    timeMs: { type: Number, default: 0 },
    memoryKb: { type: Number, default: 0 },
    provider: { type: String, default: "judge0" },
  },
  { timestamps: true }
);

executionSchema.index({ room: 1, createdAt: -1 });

export default mongoose.model("Execution", executionSchema);