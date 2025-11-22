// models/admitCardmodel.js
import mongoose from "mongoose";

const AdmitCardSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
    },
    ApplicantName: { type: String, required: false }, // optional if using studentId
    contact: { type: String, required: false },
    college: { type: String, required: false },
    branch: { type: String, required: false },
    year: { type: String, required: false },

    // RSAT: required & unique per your original schema — but we generate if not provided
    RSAT: { type: String, required: true, unique: true },

    venue: { type: String, required: true },
    examDate: { type: Date, required: true },
    examTime: { type: String, required: true },
    ReportingTime: { type: String, required: true },



    // metadata to track issuing & email status
    issuedBy: { type: String }, // admin id or name
    issuedAt: { type: Date },
    emailSent: { type: Boolean, default: false },
    emailSentAt: { type: Date },
    emailError: { type: String, default: null },
  },
  { timestamps: true }
);

const AdmitCard = mongoose.model("AdmitCard", AdmitCardSchema);
export default AdmitCard;
