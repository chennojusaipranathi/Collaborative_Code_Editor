import mongoose from "mongoose";

// A schema describes what a user document looks like and which rules it follows
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 60,
    },
    email: {
      type: String,
      required: true,
      unique: true, // MongoDB refuses two users with the same email
      lowercase: true, // "A@x.com" and "a@x.com" are the same person
      trim: true,
    },
    // We store a hash of the password, never the password itself (next step)
    passwordHash: {
      type: String,
      required: true,
      select: false, // queries leave this field out unless we ask for it
    },
    role: {
      type: String,
      enum: ["student", "teacher"],
      default: "student",
    },
  },
  { timestamps: true } // adds createdAt and updatedAt automatically
);

export default mongoose.model("User", userSchema);