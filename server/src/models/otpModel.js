import mongoose from "mongoose";

const otpSchema = mongoose.Schema({
    otpfor: { //can be an email or phone number
        type: String,
        required: true,
    },
    otp: {
        type: String,
        required: true,
    },
    type: {
        type: String,
        enum: ['email', 'phone'],
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: '5m',
    },
});

const Otp = mongoose.model("Otp", otpSchema);

export default Otp;
