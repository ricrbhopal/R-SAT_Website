import mongoose from "mongoose";

const admitCardSchema = new mongoose.Schema(
  {
    student_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
      unique: true,
    },
    status: {
      type: String,
      enum: ["active", "Inactive"],
      default: "Inactive",
    },
    issuedDate: {
      type: Date,
    },
  },
  { timestamps: true }
);
export const AdmitCard = mongoose.model("AdmitCard", admitCardSchema);
