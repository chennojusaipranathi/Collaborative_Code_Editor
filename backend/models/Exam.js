import mongoose from "mongoose";

const examSchema = new mongoose.Schema(
  {
    room: { type: mongoose.Schema.Types.ObjectId, ref: "Room", required: true, unique: true },
    title: { type: String, required: true, trim: true, maxlength: 100 },
    durationMinutes: { type: Number, required: true, min: 1, max: 300 },
    problem: { type: String, required: true, maxlength: 5000 },
    open: { type: Boolean, default: false }, // students can start only while open
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

export default mongoose.model("Exam", examSchema);