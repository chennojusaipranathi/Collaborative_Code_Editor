import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema(
  {
    exam: { type: mongoose.Schema.Types.ObjectId, ref: "Exam", required: true },
    room: { type: mongoose.Schema.Types.ObjectId, ref: "Room", required: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    studentName: { type: String, required: true },
    startedAt: { type: Date, required: true },
    endsAt: { type: Date, required: true }, // set by the SERVER when the student starts
    code: { type: String, default: "", maxlength: 200000 },
    lastActiveAt: { type: Date, default: null },
    submittedAt: { type: Date, default: null },
    submitReason: { type: String, default: "" }, // "manual" or "timeout"
    tabSwitches: { type: Number, default: 0 },
    pastes: { type: Number, default: 0 },
    grade: { type: Number, default: null },
    feedback: { type: String, default: "" },
  },
  { timestamps: true }
);

// One session per student per exam, so refreshing can never restart the clock
sessionSchema.index({ exam: 1, student: 1 }, { unique: true });

export default mongoose.model("ExamSession", sessionSchema);