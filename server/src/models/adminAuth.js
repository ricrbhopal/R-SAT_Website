import mongoose from 'mongoose';

const adminAuthSchema = new mongoose.Schema({
    student_id: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Student',
    },
    reffer_id: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Referred',
    },
  username: { type: String, required: true, unique: true },
  phone: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["admin", "manager", "caller"], default: "caller" },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
    
}, { timestamps: true });

const Admin = mongoose.model('Admin', adminAuthSchema);

export default Admin;