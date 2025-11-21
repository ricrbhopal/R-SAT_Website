// controllers/referralController.js
import crypto from "crypto";
import Referred from "../models/refferedModel.js";
import Student from "../models/authModel.js";
import { generateAuthToken } from "../utils/genAuthToken.js";
import { sendOTPPhone } from "../utils/phoneService.js";
import { sendCredentialsEmail } from "../utils/emailService.js";
import bcrypt from "bcryptjs";
import Otp from "../models/otpModel.js";

/**
 * POST /api/referrals/send-otp
 * body: { phoneNo, ref? }
 */
export const sendReferralOTP = async (req, res, next) => {
  try {
    const { phoneNo, ref } = req.body;
    if (!phoneNo) return res.status(400).json({ message: "phoneNo is required" });

    if (ref) {
      const refer = await Referred.findOne({ refCode: ref });
      if (!refer) return res.status(400).json({ message: "Invalid referral code" });
      if (refer.referredStudentId) {
        return res.status(400).json({ message: "This referral link has already been used" });
      }
    }

    await Otp.deleteMany({ otpfor: phoneNo.toString(), type: "phone" });

    const phoneOTP = Math.floor(100000 + Math.random() * 900000).toString();

    try {
      await sendOTPPhone(phoneNo.toString(), phoneOTP);
    } catch (smsErr) {
      console.error("sendOTPPhone error:", smsErr);
      return res.status(502).json({ message: "Failed to send OTP. Try again later." });
    }

    const hashed = await bcrypt.hash(phoneOTP, 10);
    await Otp.create({
      otpfor: phoneNo.toString(),
      otp: hashed,
      type: "phone",
      createdAt: new Date(),
    });

    return res.status(200).json({ message: "OTP sent successfully" });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/referrals/create  (auth required)
 */
export const createReferral = async (req, res, next) => {
  try {
    const referrer = req.user;
    if (!referrer) return res.status(401).json({ message: "Unauthorized" });

    const { referredName, referredEmail, referredPhone, collegeName, year } = req.body;

    let refCode;
    for (let attempt = 0; attempt < 5; attempt++) {
      refCode = crypto.randomBytes(6).toString("hex");
      const exists = await Referred.findOne({ refCode });
      if (!exists) break;
      refCode = null;
    }
    if (!refCode) return res.status(500).json({ message: "Could not generate unique referral code" });

    const referrerStudentID = referrer.student_ID || referrer.studentId || referrer.student_id || null;

    const newRef = await Referred.create({
      referrerId: referrer._id,
      referrerUserId: referrer._id,
      referrerStudentID,
      referredName: referredName || "",
      referredEmail: referredEmail || "",
      referredPhone: referredPhone || "",
      collegeName: collegeName || "",
      year: year || "",
      refCode,
    });

    const frontendBase = process.env.FRONTEND_URL || "http://localhost:5173";
    const link = `${frontendBase}/candidateDashboard/RefferedRegisterationPage?ref=${encodeURIComponent(
      refCode
    )}${referrerStudentID ? `&studentId=${encodeURIComponent(referrerStudentID)}` : ""}`;

    res.status(201).json({ message: "Referral created", ref: newRef, referralLink: link });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/referrals/info/:code
 */
export const getReferralInfo = async (req, res, next) => {
  try {
    const { code } = req.params;
    const refer = await Referred.findOne({ refCode: code }).populate("referrerId", "student_ID fullName mail_ID phoneNo");
    if (!refer) return res.status(404).json({ message: "Referral not found" });

    res.status(200).json({
      referrer: {
        id: refer.referrerId?._id ?? null,
        name: refer.referrerId?.fullName ?? null,
        student_ID: refer.referrerStudentID ?? refer.referrerId?.student_ID ?? null,
        userId: refer.referrerUserId ?? refer.referrerId?._id ?? null,
      },
      referredName: refer.referredName || null,
      referredEmail: refer.referredEmail || null,
      referredPhone: refer.referredPhone || null,
      collegeName: refer.collegeName || null,
      year: refer.year || null,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/referrals/register?ref=REFCODE
 * body: { fullName, phoneNo, mail_ID, college, branch, year, dob, phoneOTP }
 */
export const registerWithReferral = async (req, res, next) => {
  try {
    const { ref } = req.query;
    if (!ref) return res.status(400).json({ message: "Referral code missing" });

    const { fullName, phoneNo, mail_ID, college, branch, year, dob, phoneOTP } = req.body;
    if (!fullName || !phoneNo || !mail_ID || !college || !branch || !year || !dob || !phoneOTP) {
      return res.status(400).json({ message: "All registration fields, including OTP, are required" });
    }

    const refer = await Referred.findOne({ refCode: ref });
    if (!refer) return res.status(400).json({ message: "Invalid referral code" });
    if (refer.referredStudentId) return res.status(400).json({ message: "This referral link has already been used" });

    const phoneOTPEntry = await Otp.findOne({ otpfor: phoneNo.toString(), type: "phone" });
    if (!phoneOTPEntry) return res.status(400).json({ message: "Phone OTP not found or expired" });

    const isPhoneOTPValid = await bcrypt.compare(phoneOTP.toString().trim(), phoneOTPEntry.otp);
    if (!isPhoneOTPValid) return res.status(400).json({ message: "Invalid Phone OTP" });

    const existEmail = await Student.findOne({ mail_ID });
    if (existEmail) return res.status(400).json({ message: "Email already registered" });

    const lastStudent = await Student.findOne().sort({ createdAt: -1 }).select("student_ID");
    const lastSegment = lastStudent?.student_ID?.split("-").pop() ?? "0000";
    const lastNumber = parseInt(lastSegment, 10);
    const nextNumber = Number.isFinite(lastNumber) ? lastNumber + 1 : 1;
    const newIdNumber = nextNumber.toString().padStart(4, "0");
    const student_ID = `RCR-RSR-${newIdNumber}`;

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

    await Otp.deleteMany({ otpfor: phoneNo.toString(), type: "phone" });

    const referralRecord = await Referred.findOneAndUpdate(
      { refCode: ref, referredStudentId: null },
      {
        referredStudentId: newStudent._id,
        referredName: fullName,
        referredEmail: mail_ID,
        referredPhone: phoneNo,
        collegeName: college,
        year: year,
        referredDate: new Date(),
      },
      { new: true }
    );

    // defensive email send: trim/validate recipient and log useful info
    const recipientEmail = (mail_ID || newStudent?.mail_ID || "").toString().trim();
    console.log("[registerWithReferral] recipientEmail:", recipientEmail);

    if (recipientEmail) {
      try {
        await sendConfirmationEmail(recipientEmail, fullName);
        console.log("[registerWithReferral] confirmation email sent to:", recipientEmail);
      } catch (mailErr) {
        console.error("[registerWithReferral] sendConfirmationEmail ERROR:", mailErr?.message || mailErr);
        console.debug("[registerWithReferral] sendConfirmationEmail full error:", mailErr);
      }
    } else {
      console.warn("[registerWithReferral] skipping confirmation email: recipient empty");
    }

    // send credentials email after registration
    if (mail_ID) {
      try {
        await sendCredentialsEmail(mail_ID, fullName, student_ID);
        console.log("Credentials email sent successfully to:", mail_ID);
      } catch (emailErr) {
        console.error("Failed to send credentials email:", emailErr);
      }
    } else {
      console.warn("No email provided; skipping credentials email.");
    }

    const token = generateAuthToken(newStudent, null, res);

    res.status(201).json({
      message: "Registration successful, referral recorded, and confirmation email sent (if available).",
      student: newStudent,
      referral: referralRecord,
      token,
    });
  } catch (err) {
    next(err);
  }
};
