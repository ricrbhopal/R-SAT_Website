import mongoose from "mongoose";

const resultSchema = new mongoose.Schema({
  student_ID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Student",
    required: true,
  },
  A: { type: Number, required: true },
  B: { type: Number, required: true },
  C: { type: Number, required: true },
  D: { type: Number, required: true },
  total: { type: Number, required: true },
  percentage: { type: Number, required: true },
  scholarShip: { type: Number, required: true },
});

const Result = mongoose.model("Result", resultSchema);
export default Result;
