// controllers/studentController.js
import Student from "../models/authModel.js";
import bcrypt from "bcryptjs";
import { sendOTPPhone } from "../utils/phoneService.js";
import Otp from "../models/otpModel.js";
import { generateAuthToken } from "../utils/genAuthToken.js";
import { sendCredentialsEmail } from "../utils/emailService.js";

/**
 * Helper: format Date -> dd-mm-yyyy string
 */
const formatDateDDMMYYYY = (d) => {
  if (!d) return "";
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return "";
  const dd = String(dt.getDate()).padStart(2, "0");
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const yyyy = dt.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
};

/**
 * Send OTP to phone number (for registration verification)
 */
export const SendOTP = async (req, res, next) => {
  try {
    const { fullName, phoneNo, email } = req.body;

    if (!fullName || !phoneNo) {
      const error = new Error("fullName and phoneNo are required");
      error.statusCode = 400;
      return next(error);
    }

    // Check if student already exists by phone or email (if provided)
    let existingStudent = null;
    try {
      const query = {
        $or: [{ phoneNo: phoneNo.toString() }],
      };
      if (email) query.$or.push({ mail_ID: email });
      existingStudent = await Student.findOne(query).lean();
    } catch (dbErr) {
      // Non-fatal: log and continue (we'll still allow OTP send)
      console.warn("DB lookup failed in SendOTP:", dbErr?.message || dbErr);
      existingStudent = null;
    }

    if (existingStudent) {
      const error = new Error(
        "A user with this phone or email already exists. If you forgot password, use the forgot-password flow or contact support."
      );
      error.statusCode = 400;
      return next(error);
    }

    // Generate 6-digit OTP (string)
    const phoneOTP = Math.floor(100000 + Math.random() * 900000).toString();

    // Remove previous OTPs for this phone
    await Otp.deleteMany({ otpfor: phoneNo.toString(), type: "phone" });

    // Send OTP via SMS service (may throw)
    await sendOTPPhone(phoneNo.toString(), phoneOTP);

    // Store hashed OTP
    const hashedPhoneOTP = await bcrypt.hash(phoneOTP, 10);
    await Otp.create({
      otpfor: phoneNo.toString(),
      otp: hashedPhoneOTP,
      type: "phone",
      createdAt: new Date(),
    });

    res.status(200).json({ message: "OTP sent successfully to phone" });
  } catch (error) {
    next(error);
  }
};

/**
 * Register a student after verifying phone OTP.
 * If registration is successful, generate student_ID, store student,
 * and send credentials email (including DOB as password).
 */
export const Register = async (req, res, next) => {
  try {
    const {
      fullName,
      phoneNo,
      phoneOTP,
      college,
      branch,
      year,
      dob,
      email,
    } = req.body;

    // Validate required fields
    if (
      !fullName ||
      !phoneNo ||
      !phoneOTP ||
      !college ||
      !branch ||
      !year ||
      !dob ||
      !email
    ) {
      const error = new Error("All required fields must be provided");
      error.statusCode = 400;
      return next(error);
    }

    // Verify phone OTP
    const phoneOTPEntry = await Otp.findOne({
      otpfor: phoneNo.toString(),
      type: "phone",
    });
    if (!phoneOTPEntry) {
      const error = new Error("Phone OTP not found or expired");
      error.statusCode = 400;
      return next(error);
    }
    const cleanPhoneOTP = phoneOTP.toString().trim();
    const isPhoneOTPValid = await bcrypt.compare(
      cleanPhoneOTP,
      phoneOTPEntry.otp
    );
    if (!isPhoneOTPValid) {
      const error = new Error("Invalid Phone OTP");
      error.statusCode = 400;
      return next(error);
    }

    // Ensure email or phone are not already registered
    const existing = await Student.findOne({
      $or: [{ mail_ID: email }, { phoneNo: phoneNo.toString() }],
    }).lean();
    if (existing) {
      const error = new Error(
        "User with this email or phone already exists. Please login or use forgot-password flow."
      );
      error.statusCode = 400;
      return next(error);
    }

    // Auto-generate student_ID like RICR-RS-0001, ensure uniqueness
    let nextNumber = 1;
    let student_ID = "";
    let exists = true;
    const lastStudent = await Student.findOne({}).sort({ createdAt: -1 }).lean();
    if (lastStudent && lastStudent.student_ID) {
      const match = lastStudent.student_ID.match(/RICR-RS-(\d+)/);
      if (match) nextNumber = parseInt(match[1], 10) + 1;
    }
    // Loop to ensure unique student_ID
    do {
      student_ID = `RICR-RS-${nextNumber.toString().padStart(4, "0")}`;
      exists = await Student.exists({ student_ID });
      if (exists) nextNumber++;
    } while (exists);

    // Create student document
    const newStudent = await Student.create({
      student_ID,
      fullName,
      phoneNo: phoneNo.toString(),
      college,
      branch,
      year,
      dob: new Date(dob),
      mail_ID: email,
      createdAt: new Date(),
    });

    // Remove used OTP entries
    await Otp.deleteMany({ otpfor: phoneNo.toString(), type: "phone" });

    // Prepare credentials object to send via email (dob as password)
    const credentialsObj = {
      name: newStudent.fullName || "",
      student_ID: newStudent.student_ID,
      dob: formatDateDDMMYYYY(newStudent.dob), // DOB as "password" in email
      testDate: undefined, // populate if you want
      venue: undefined, // populate if you want
    };

    // Send credentials email (handle errors but don't fail registration)
    try {
      const emailSent = await sendCredentialsEmail(email, credentialsObj);
      if (emailSent === false) {
        // If sendCredentialsEmail returns false on failure (as in your util),
        // log and continue (already registered).
        console.warn(
          `[Register] sendCredentialsEmail returned false for ${email}`
        );
      } else {
        console.log(`[Register] Confirmation email sent to ${email}`);
      }
    } catch (emailError) {
      console.error(
        `[Register] Failed to send confirmation email to ${email}:`,
        emailError
      );
    }

    res.status(201).json({
      message: "Student registered successfully. Confirmation email attempted.",
      student: {
        student_ID: newStudent.student_ID,
        fullName: newStudent.fullName,
        phoneNo: newStudent.phoneNo,
        mail_ID: newStudent.mail_ID,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Re-send credentials: expects { mail_ID, student_ID } in body.
 * Fetches student, prepares credentials object (with dob), and sends email.
 */
export const SendCredentials = async (req, res, next) => {
  try {
    const { mail_ID, student_ID } = req.body;
    if (!mail_ID || !student_ID) {
      const error = new Error(
        "mail_ID and student_ID are required to send credentials"
      );
      error.statusCode = 400;
      return next(error);
    }

    // Fetch student to get DOB and name
    const student = await Student.findOne({
      student_ID,
      mail_ID,
    }).lean();

    if (!student) {
      const error = new Error(
        "Student not found with provided student_ID and mail_ID"
      );
      error.statusCode = 404;
      return next(error);
    }

    const credentialsObj = {
      name: student.fullName || "",
      student_ID: student.student_ID,
      dob: student.dob ? formatDateDDMMYYYY(student.dob) : "",
      // add other fields if needed
    };

    const emailSent = await sendCredentialsEmail(mail_ID, credentialsObj);

    if (emailSent === false) {
      return res
        .status(502)
        .json({ message: "Failed to send email. Check mail server logs." });
    }

    res.status(200).json({ message: "Credentials emailed successfully" });
  } catch (error) {
    next(error);
  }
};

/**
 * Login using student_ID and DOB
 */
export const Login = async (req, res, next) => {
  try {
    const { student_ID, dob } = req.body;
    if (!student_ID || !dob) {
      const error = new Error("Both student_ID and dob are required");
      error.statusCode = 400;
      return next(error);
    }

    const student = await Student.findOne({ student_ID }).lean();
    if (!student) {
      const error = new Error("Invalid credentials");
      error.statusCode = 401;
      return next(error);
    }

    // Normalize dates to date-only for comparison
    const normalize = (d) => {
      const dt = new Date(d);
      dt.setHours(0, 0, 0, 0);
      return dt.getTime();
    };

    const provided = normalize(dob);
    const stored = student.dob ? normalize(student.dob) : null;
    if (!stored || provided !== stored) {
      const error = new Error("Invalid credentials");
      error.statusCode = 401;
      return next(error);
    }

    // create token and send (generateAuthToken may set a cookie)
    const token = generateAuthToken(student, null, res);

    res.status(200).json({
      message: "Login successful",
      student,
      token,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Logout - clear cookie token if used
 */
export const Logout = (req, res, next) => {
  try {
    res.clearCookie("token", { maxAge: 0 });
    res.status(200).json({ message: "Logout successful" });
  } catch (error) {
    next(error);
  }
};

/**
 * Fetch logged-in student's profile
 * (expects an auth middleware that sets req.user)
 */
export const getStudentProfile = async (req, res, next) => {
  try {
    const user = req.user;
    if (!user) {
      const error = new Error("User not found");
      error.statusCode = 404;
      return next(error);
    }
    const student = await Student.findById(user._id).select("-__v").lean();
    res.status(200).json({
      message: "Profile fetched successfully",
      student,
    });
  } catch (error) {
    next(error);
  }
};
