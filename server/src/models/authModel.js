import mongoose from "mongoose";

const StudentSchema = new mongoose.Schema(
  {
    student_ID: {
      type: String,
      required: true,
      unique: true,
    },
    fullName: {
      type: String,
      required: true,
    },
    phoneNo:{
        type: String,
        required: true,
    },
    mail_ID: {
        type: String,
        required: true,
    },
    college:{
        type: String,
        required: true,
    },
    branch:{
        type: String,
        required: true,
    },
    year:{
        type: String,
        required: true,
    },
    dob:{
        type: Date,
        required: true,}
    },
  { timestamps: true }
);

const Student = mongoose.model("Student", StudentSchema);

export default Student;
