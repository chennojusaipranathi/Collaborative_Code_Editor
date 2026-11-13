import mongoose from "mongoose";

const submissionSchema = new mongoose.Schema(
  {
    room: { type: mongoose.Schema.Types.ObjectId, ref: "Room", required: true },
    task: { type: mongoose.Schema.Types.ObjectId, ref: "Task", required: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    studentName: { type: String, required: true },
    fileName: { type: String, required: true },
    content: { type: String, default: "", maxlength: 200000 },
    submittedAt: { type: Date, required: true },
  },
  { timestamps: true }
);

// One submission per student per task. Resubmitting replaces it.
submissionSchema.index({ task: 1, student: 1 }, { unique: true });

export default mongoose.model("Submission", submissionSchema);