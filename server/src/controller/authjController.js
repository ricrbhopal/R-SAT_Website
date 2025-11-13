// studentController.js
import Student from '../models/authModel.js'; // ensure path is correct
import bcrypt from 'bcryptjs';
import { sendOTPEmail, sendCredentialsEmail } from '../utils/emailService.js';
import { sendOTPPhone } from '../utils/phoneService.js';
import Otp from '../models/otpModel.js';
import { generateAuthToken } from '../utils/genAuthToken.js'; // adjust if signature differs

// Helper: generate random password if user didn't provide one
const genRandomPassword = (len = 8) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$!';
  let pw = '';
  for (let i = 0; i < len; i++) pw += chars[Math.floor(Math.random() * chars.length)];
  return pw;
};

// Send OTPs to email and phoneNo
export const SendOTP = async (req, res, next) => {
  try {
    const { fullName, mail_ID, phoneNo } = req.body;

    if (!fullName || !mail_ID || !phoneNo) {
      const error = new Error('All fields (fullName, mail_ID, phoneNo) are required');
      error.statusCode = 400;
      return next(error);
    }

    // If a student with same email already exists, you may block or allow resend.
    // Wrap DB lookup in try/catch so server doesn't return 500 if DB isn't connected.
    let existingStudent = null;
    try {
      existingStudent = await Student.findOne({ mail_ID });
    } catch (dbErr) {
      console.warn('DB lookup failed in SendOTP (continuing):', dbErr.message || dbErr);
      existingStudent = null;
    }
    if (existingStudent) {
      const error = new Error('Email already registered. If you forgot password, use forgot-password flow.');
      error.statusCode = 400;
      return next(error);
    }

    const emailOTP = Math.floor(100000 + Math.random() * 900000).toString();
    const phoneOTP = Math.floor(100000 + Math.random() * 900000).toString();

    // Remove any previous OTP entries for that email/phone
  await Otp.deleteMany({ otpfor: mail_ID, type: 'email' });
  await Otp.deleteMany({ otpfor: phoneNo.toString(), type: 'phone' });

  // Send OTPs (assumed implemented)
  await sendOTPEmail(mail_ID, emailOTP);
    await sendOTPPhone(phoneNo.toString(), phoneOTP);

    const hashedEmailOTP = await bcrypt.hash(emailOTP, 10);
    const hashedPhoneOTP = await bcrypt.hash(phoneOTP, 10);

    await Otp.create({
      otpfor: mail_ID,
      otp: hashedEmailOTP,
      type: 'email',
    });

    await Otp.create({
      otpfor: phoneNo.toString(),
      otp: hashedPhoneOTP,
      type: 'phone',
    });

    res.status(200).json({ message: 'OTPs sent successfully to email and phone' });
  } catch (error) {
    next(error);
  }
};

// Register student after verifying both OTPs. If password not provided, generate one and email it.
export const Register = async (req, res, next) => {
  try {
    const { fullName, mail_ID, phoneNo, phoneOTP, emailOTP, college, branch, year, dob } = req.body;

    if (!fullName || !mail_ID || !phoneNo || !phoneOTP || !emailOTP || !college || !branch || !year || !dob) {
      const error = new Error('All required fields must be provided');
      error.statusCode = 400;
      return next(error);
    }

    // Verify email OTP
    const emailOTPEntry = await Otp.findOne({ otpfor: mail_ID, type: 'email' });
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
    const phoneOTPEntry = await Otp.findOne({ otpfor: phoneNo.toString(), type: 'phone' });
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

    // Auto-generate student_ID like RICR-RS-0001
    const lastStudent = await Student.findOne({}).sort({ createdAt: -1 });
    let nextNumber = 1;
    if (lastStudent && lastStudent.student_ID) {
      const match = lastStudent.student_ID.match(/RICR-RS-(\d+)/);
      if (match) nextNumber = parseInt(match[1], 10) + 1;
    }
    const student_ID = `RICR-RS-${nextNumber.toString().padStart(4, '0')}`;

    // Create student document
    const newStudent = await Student.create({
      student_ID,
      fullName,
      phoneNo: phoneNo.toString(),
      mail_ID,
      college,
      branch,
      year,
      dob: new Date(dob),
    });

    // Remove used OTPs (optional cleanup)
    await Otp.deleteMany({ otpfor: mail_ID, type: 'email' });
    await Otp.deleteMany({ otpfor: phoneNo.toString(), type: 'phone' });

    // Send credentials email (student_ID)
    await sendCredentialsEmail(mail_ID, student_ID);

    res.status(201).json({
      message: 'Student registered successfully. Login credentials sent to email.',
      student: {
        student_ID: newStudent.student_ID,
        fullName: newStudent.fullName,
        mail_ID: newStudent.mail_ID,
        phoneNo: newStudent.phoneNo,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Send credentials separately (if you want to re-send credentials)
export const SendCredentials = async (req, res, next) => {
  try {
    const { mail_ID, student_ID } = req.body;
    if (!mail_ID || !student_ID) {
      const error = new Error('mail_ID and student_ID are required to send credentials');
      error.statusCode = 400;
      return next(error);
    }

    // Optional: validate student exists
    const student = await Student.findOne({ student_ID, mail_ID });
    if (!student) {
      const error = new Error('Student not found with provided student_ID and mail_ID');
      error.statusCode = 404;
      return next(error);
    }

    await sendCredentialsEmail(mail_ID, student_ID);

    res.status(200).json({ message: 'Credentials emailed successfully' });
  } catch (error) {
    next(error);
  }
};

// Login using student_ID and password (recommended)
export const Login = async (req, res, next) => {
  try {
    const { student_ID, dob } = req.body;
    if (!student_ID || !dob) {
      const error = new Error('Both student_ID and dob are required');
      error.statusCode = 400;
      return next(error);
    }

    const student = await Student.findOne({ student_ID }).lean();
    if (!student) {
      const error = new Error('Invalid credentials');
      error.statusCode = 401;
      return next(error);
    }

    // Compare DOB (normalize to date-only)
    const normalize = (d) => {
      const dt = new Date(d);
      dt.setHours(0,0,0,0);
      return dt.getTime();
    };

    const provided = normalize(dob);
    const stored = student.dob ? normalize(student.dob) : null;
    if (!stored || provided !== stored) {
      const error = new Error('Invalid credentials');
      error.statusCode = 401;
      return next(error);
    }

    const token = generateAuthToken(student, null, res);

    res.status(200).json({
      message: 'Login successful',
      student,
      token,
    });
  } catch (error) {
    next(error);
  }
};

// Logout
export const Logout = (req, res, next) => {
  try {
    res.clearCookie('token', { maxAge: 0 });
    res.status(200).json({ message: 'Logout successful' });
  } catch (error) {
    next(error);
  }
};

// refreshData: return latest student data (requires auth middleware to set req.user)
// export const refreshData = async (req, res, next) => {
//   try {
//     const user = req.user; // ensure auth middleware attaches student doc to req.user
//     if (!user) {
//       const error = new Error('User not found');
//       error.statusCode = 404;
//       return next(error);
//     }

//     const student = await Student.findById(user._id).select('-__v').lean();
//     res.status(200).json({
//       message: 'Data refreshed successfully',
//       student,
//     });
//   } catch (error) {
//     next(error);
//   }
// };
