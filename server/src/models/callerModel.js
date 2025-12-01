import mongoose from "mongoose";

const callerSchema = new mongoose.Schema({
  student_ID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Student",
  },
  admin_ID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Admin",
  },
  reffered_ID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Referred",
  },
  admitCard_ID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "AdmitCard",
  },
  demoClass_ID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Demo",
  },
  result: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Result",
  },
});

const Caller = mongoose.model("Caller", callerSchema);

export default Caller;
