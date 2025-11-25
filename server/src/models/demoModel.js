import mongoose from "mongoose";

const demoSchema = new mongoose.Schema({
  studentName: {
    type: String,
  },
  email: {
    type: String,
  },
  phone: {
    type: String,
  },
  collegeName: {
    type: String,
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
