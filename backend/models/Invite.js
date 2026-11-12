import mongoose from "mongoose";

const inviteSchema = new mongoose.Schema(
  {
    room: { type: mongoose.Schema.Types.ObjectId, ref: "Room", required: true, index: true },
    token: { type: String, required: true, unique: true },
    role: { type: String, enum: ["editor", "viewer"], required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    expiresAt: { type: Date, required: true },
    uses: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// MongoDB deletes the document automatically once expiresAt passes
inviteSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model("Invite", inviteSchema);