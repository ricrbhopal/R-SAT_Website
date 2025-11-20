// models/referredModel.js
import mongoose from "mongoose";

const referredSchema = new mongoose.Schema(
  {
    // original: reference to the student (ObjectId)
    referrerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },

    // explicit saved referrer user id (redundant with referrerId but useful)
    referrerUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
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
    referredName: { type: String },
    referredEmail: { type: String },
    referredPhone: { type: String },
    collegeName: { type: String },
    year: { type: String },

    // unique referral code
    refCode: { type: String, required: true, unique: true },

    referredDate: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const Referred = mongoose.model("Referred", referredSchema);
export default Referred;
