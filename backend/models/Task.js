import mongoose from "mongoose";

const taskSchema = new mongoose.Schema(
  {
    room: { type: mongoose.Schema.Types.ObjectId, ref: "Room", required: true, unique: true },
    title: { type: String, required: true, trim: true, maxlength: 100 },
    description: { type: String, default: "", maxlength: 2000 },
    deadline: { type: Date, default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

export default mongoose.model("Task", taskSchema);