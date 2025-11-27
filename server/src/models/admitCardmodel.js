// models/AdmitCard.js
import mongoose from 'mongoose';

const AdmitCardSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
  ApplicantName: String,
  contact: String,
  college: String,
  branch: String,
  year: String,
  RSAT: String,
  venue: String,
  examDate: Date,
  examTime: String,
  ReportingTime: String,
  emailSent: Boolean,
  emailError: String,
  // attendance fields
  present: { type: Boolean, default: false },
  presentedAt: { type: Date },
  presentedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // who scanned
  presentTokenUsed: { type: String }, // optional: store token id/nonce
  downloadedAt: { type: Date },
  downloadCount: { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.model('AdmitCard', AdmitCardSchema);
