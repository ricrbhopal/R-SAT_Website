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
    username: { 
        type: String, 
        required: true, 
    },
    role:{
        enum: ['admin', 'manager', 'caller'],
        type: String,
        default: 'admin',   
    },
    phone: { 
        type: String, 
        required: true,
        unique: true, 
    },
    password: {
        type: String,
        required: true,
    },
}, { timestamps: true });

const AdminAuth = mongoose.model('AdminAuth', adminAuthSchema);

export default AdminAuth;