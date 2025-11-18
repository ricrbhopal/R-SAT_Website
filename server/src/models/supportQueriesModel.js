import mongoose from "mongoose";

const supportQuerySchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
    },
    subject: { type: String },
    description: { type: String}, 
    status: {
      type: String,
      enum: ["open", "in_progress", "resolved"],
      default: "open",
    },
    responses: [
      {
        responder: { type: String}, 
        message: { type: String },
        date: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

const SupportQuery = mongoose.model("SupportQuery", supportQuerySchema);
export default SupportQuery;
