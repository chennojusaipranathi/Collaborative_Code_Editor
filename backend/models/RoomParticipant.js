import mongoose from "mongoose";

const participantSchema = new mongoose.Schema(
  {
    room: { type: mongoose.Schema.Types.ObjectId, ref: "Room", required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    role: { type: String, enum: ["owner", "editor", "viewer"], default: "editor" },
  },
  { timestamps: true }
);

// A user can be in a room only once (the database enforces this)
participantSchema.index({ room: 1, user: 1 }, { unique: true });

export default mongoose.model("RoomParticipant", participantSchema);