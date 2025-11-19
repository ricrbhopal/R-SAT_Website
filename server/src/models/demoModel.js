import mongoose from "mongoose";

const demoSchema = new mongoose.Schema({
  studentName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  phone: {
    type: String,
    required: true,
  },
  collegeName: {
    type: String,
    required: true,
  },
  year: {
    type: String,
    required: true,
  },
  demoSlot: {
    type: String,
    required: true,
  },
  type:{
    enum: ['online', 'offline'],
    type: String,
    default: 'offline',
  }
});

const Demo = mongoose.model("Demo", demoSchema);
export default Demo;
