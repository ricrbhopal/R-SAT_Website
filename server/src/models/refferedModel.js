// models/referredModel.js
import mongoose from "mongoose";

const referredSchema = new mongoose.Schema(
  {
    referrerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    referredName: { type: String }, // optional prefilled / filled on register
    referredEmail: { type: String }, // optional prefilled / filled on register
    referredPhone: { type: String }, // optional prefilled / filled on register
    collegeName: { type: String },
    year: { type: String },
    refCode: { type: String, required: true, unique: true }, // unique referral code used in link
    referredDate: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const Referred = mongoose.model("Referred", referredSchema);
export default Referred;
