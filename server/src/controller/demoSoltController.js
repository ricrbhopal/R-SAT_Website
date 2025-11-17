import Demo from "../models/demoModel.js"; 
import bcrypt from 'bcryptjs';
import { sendOTPEmail } from '../utils/emailService.js';
import { sendOTPPhone } from '../utils/phoneService.js';
import Otp from '../models/otpModel.js';

// Send OTPs to email and phoneNo for demo slot booking
export const SendDemoOTP = async (req, res, next) => {
  try {
    const { studentName, email, phone } = req.body;
    if (!studentName || !email || !phone) {
      const error = new Error('All fields (studentName, email, phone) are required');
      error.statusCode = 400;
      return next(error);
    }
    const emailOTP = Math.floor(100000 + Math.random() * 900000).toString();
    const phoneOTP = Math.floor(100000 + Math.random() * 900000).toString();
    // Remove any previous OTP entries for that email/phone
    await Otp.deleteMany({ otpfor: email, type: 'email' });
    await Otp.deleteMany({ otpfor: phone.toString(), type: 'phone' });
    // Send OTPs (assumed implemented)
    await sendOTPEmail(email, emailOTP);
    await sendOTPPhone(phone.toString(), phoneOTP);
    const hashedEmailOTP = await bcrypt.hash(emailOTP, 10);
    const hashedPhoneOTP = await bcrypt.hash(phoneOTP, 10);
    await Otp.create({
        otpfor: email,
        otp: hashedEmailOTP,
        type: 'email',
    });
    await Otp.create({
        otpfor: phone.toString(),
        otp: hashedPhoneOTP,
        type: 'phone',
    });
    res.status(200).json({ message: 'OTPs sent successfully to email and phone' });
  }
    catch (error) {
    next(error);
    }
};

// Book demo slot after verifying both OTPs
export const BookDemoSlot = async (req, res, next) => {
  try {
    const { studentName, email, phone, collegeName, year, demoSolt, emailOTP, phoneOTP } = req.body;
    if (!studentName || !email || !phone || !collegeName || !year || !demoSolt || !emailOTP || !phoneOTP) {
      const error = new Error('All fields are required for booking demo slot');
      error.statusCode = 400;
      return next(error);
    }
    // Verify email OTP
    const emailOTPEntry = await Otp.findOne({ otpfor: email, type: 'email' });
    if (!emailOTPEntry) {
        const error = new Error('Email OTP not found or expired');
        error.statusCode = 400;
        return next(error);
    }
    const cleanEmailOTP = emailOTP.toString().trim();
    const isEmailOTPValid = await bcrypt.compare(cleanEmailOTP, emailOTPEntry.otp);
    if (!isEmailOTPValid) {
        const error = new Error('Invalid Email OTP');
        error.statusCode = 400;
        return next(error);
    }
    // Verify phone OTP
    const phoneOTPEntry = await Otp.findOne({ otpfor: phone.toString(), type: 'phone' });
    if (!phoneOTPEntry) {
        const error = new Error('Phone OTP not found or expired');
        error.statusCode = 400;
        return next(error);
    }
    const cleanPhoneOTP = phoneOTP.toString().trim();
    const isPhoneOTPValid = await bcrypt.compare(cleanPhoneOTP, phoneOTPEntry.otp);
    if (!isPhoneOTPValid) {
        const error = new Error('Invalid Phone OTP');
        error.statusCode = 400;
        return next(error);
    }

    await Demo.create({
      studentName,
      email,
      phone,
      collegeName,
      year,
      demoSolt,
    });

    // Remove used OTPs after successful booking
    await Otp.deleteMany({ otpfor: email, type: 'email' });
    await Otp.deleteMany({ otpfor: phone.toString(), type: 'phone' });

    res.status(200).json({ message: 'Demo slot booked successfully' });
  } catch (error) {
    next(error);
  }
};

export const GetDemoSlots = async (req, res, next) => {
  try {
    const demoSlots = await Demo.find({});
    res.status(200).json(demoSlots);
  } catch (error) {
    next(error);
  }
};


