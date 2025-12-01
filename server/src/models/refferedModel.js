// server/src/models/refferedModel.js
import mongoose from "mongoose";

const referredSchema = new mongoose.Schema(
  {
    // explicit saved referrer user id (Student)
    referrerUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: false,
      default: null,
    },

    // caller/admin who referred (Admin / Caller model)
    referrerCallerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      default: null,
    },

    // legacy field to store Student._id if used previously
    referrerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      default: null,
    },

    // store the referrer's student_ID string (e.g., RCR-RSR-0002)
    referrerStudentID: {
      type: String,
      default: null,
    },

    // when referred user actually registers, set this
    referredStudentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      default: null,
    },

    // details about the person being invited / prefilled values
    referredName: { type: String, default: "" },
    referredEmail: { type: String, default: "" },
    referredPhone: { type: String, default: "" },
    collegeName: { type: String, default: "" },
    year: { type: String, default: "" },

    // A stable reference code (we'll store the referrer id as string here).
    // Use sparse unique index to avoid conflicts with older docs missing this field.
    refCode: {
      type: String,
      index: true,
      unique: true,
      sparse: true,
      default: null,
    },

    referredDate: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const Referred = mongoose.model("Referred", referredSchema);
export default Referred;
