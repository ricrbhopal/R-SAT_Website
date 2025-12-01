// server/src/controller/refferedController.js
import mongoose from "mongoose";
import Referred from "../models/refferedModel.js";
import Student from "../models/authModel.js";
import { generateAuthToken } from "../utils/genAuthToken.js";
import { sendOTPPhone } from "../utils/phoneService.js";
import { sendCredentialsEmail, sendReferralConfirmationEmail } from "../utils/emailService.js";
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

    // If ref provided, do a soft validation (don't block if there is no Referred doc).
    // This allows sending OTP even if referrer hasn't yet created a Referred doc,
    // because we accept userId links too and will fallback to Student lookup.
    if (ref) {
      try {
        const found = await Referred.findOne({ referrerUserId: ref }).lean();
        // do not return error here — only log if missing
        if (!found) console.warn("[sendReferralOTP] no Referred record found for ref:", ref);
      } catch (e) {
        console.warn("[sendReferralOTP] lookup failed:", e?.message || e);
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
 * body: { referredName?, referredEmail?, referredPhone?, collegeName?, year? }
 *
 * Behavior:
 * - If referrer already has a referral record (referrerUserId), return that existing referralLink (idempotent).
 * - Else create a Referred document and return referralLink using only userId (query param userId).
 */
export const createReferral = async (req, res, next) => {
  try {
    const referrer = req.user;
    if (!referrer) {
      return res.status(401).json({ message: "Unauthorized: login required to create referral" });
    }

    const referrerUserId = String(referrer._id);
    // Check existing record
    let existing = await Referred.findOne({ referrerUserId }).lean();
    if (existing) {
      const frontendBase = (process.env.FRONTEND_URL && process.env.FRONTEND_URL.trim()) || "https://rsat.ricr.in";
      const referralLink = `${frontendBase.replace(/\/+$/, "")}/candidateDashboard/RefferedRegisterationPage?userId=${encodeURIComponent(referrerUserId)}`;
      return res.status(200).json({ message: "Referral exists", ref: existing, referralLink });
    }

    const { referredName, referredEmail, referredPhone, collegeName, year } = req.body || {};
    const payload = {
      referrerId: referrer._id,
      referrerUserId,
      referrerStudentID: referrer.student_ID || referrer.studentId || referrer.student_id || null,
      referredName: referredName || "",
      referredEmail: referredEmail || "",
      referredPhone: referredPhone || "",
      collegeName: collegeName || "",
      year: year || "",
    };

    let newRef;
    try {
      newRef = await Referred.create(payload);
    } catch (createErr) {
      console.error("[createReferral] create error:", createErr);
      if (createErr.name === "ValidationError") {
        return res.status(400).json({ message: "Invalid referral data", details: createErr.errors });
      }
      if (createErr.code === 11000) {
        return res.status(409).json({ message: "Duplicate referral detected", key: createErr.keyValue });
      }
      return res.status(500).json({ message: "Failed to create referral", error: createErr.message });
    }

    const frontendBase = (process.env.FRONTEND_URL && process.env.FRONTEND_URL.trim()) || "https://rsat.ricr.in";
    const referralLink = `${frontendBase.replace(/\/+$/, "")}/candidateDashboard/RefferedRegisterationPage?userId=${encodeURIComponent(referrerUserId)}`;

    return res.status(201).json({ message: "Referral created", ref: newRef, referralLink });
  } catch (err) {
    console.error("[createReferral] unexpected:", err && err.stack ? err.stack : err);
    return res.status(500).json({ message: "Server error while creating referral" });
  }
};

/**
 * GET /api/referrals/info/:code
 * code is expected to be referrerUserId (string) or a user ObjectId
 *
 * This endpoint will:
 *  - try Referred.findOne({ referrerUserId: code })
 *  - if not found and code is ObjectId, try Referred.findOne({ referrerId: code })
 *  - if still not found and code is valid ObjectId, try Student.findById(code) and synthesize response
 */
export const getReferralInfo = async (req, res, next) => {
  try {
    const { code } = req.params;
    if (!code) return res.status(400).json({ message: "Referral code is required" });

    console.log("[getReferralInfo] code:", code);

    // 1) Try lookup by referrerUserId (string)
    let refer = await Referred.findOne({ referrerUserId: code }).populate("referrerId", "student_ID fullName mail_ID phoneNo").lean();
    if (refer) {
      return res.status(200).json({
        referrer: {
          id: refer.referrerId?._id ?? null,
          name: refer.referrerId?.fullName ?? refer.referrerStudentID ?? null,
          student_ID: refer.referrerStudentID ?? refer.referrerId?.student_ID ?? null,
          userId: refer.referrerUserId ?? refer.referrerId?._id ?? null,
        },
        referredName: refer.referredName || null,
        referredEmail: refer.referredEmail || null,
        referredPhone: refer.referredPhone || null,
        collegeName: refer.collegeName || null,
        year: refer.year || null,
      });
    }

    // 2) If code is ObjectId, try lookup by referrerId
    if (mongoose.Types.ObjectId.isValid(code)) {
      refer = await Referred.findOne({ referrerId: code }).populate("referrerId", "student_ID fullName mail_ID phoneNo").lean();
      if (refer) {
        return res.status(200).json({
          referrer: {
            id: refer.referrerId?._id ?? null,
            name: refer.referrerId?.fullName ?? refer.referrerStudentID ?? null,
            student_ID: refer.referrerStudentID ?? refer.referrerId?.student_ID ?? null,
            userId: refer.referrerUserId ?? refer.referrerId?._id ?? null,
          },
          referredName: refer.referredName || null,
          referredEmail: refer.referredEmail || null,
          referredPhone: refer.referredPhone || null,
          collegeName: refer.collegeName || null,
          year: refer.year || null,
        });
      }
    }

    // 3) Fallback: try find Student by id and synthesize referrer
    if (mongoose.Types.ObjectId.isValid(code)) {
      const student = await Student.findById(code, "student_ID fullName mail_ID phoneNo").lean();
      if (student) {
        return res.status(200).json({
          referrer: {
            id: student._id || null,
            name: student.fullName || null,
            student_ID: student.student_ID || null,
            userId: student._id || null,
          },
          referredName: null,
          referredEmail: null,
          referredPhone: null,
          collegeName: null,
          year: null,
        });
      }
    }

    // Nothing found
    return res.status(404).json({ message: "Referral not found" });
  } catch (err) {
    console.error("[getReferralInfo] ERROR:", err && err.stack ? err.stack : err);
    next(err);
  }
};

/**
 * POST /api/referrals/register?userId=REFUSERID
 */
export const registerWithReferral = async (req, res, next) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ message: "Referral userId missing" });

    const { fullName, phoneNo, mail_ID, college, branch, year, dob, phoneOTP } = req.body;
    if (!fullName || !phoneNo || !mail_ID || !college || !branch || !year || !dob || !phoneOTP) {
      return res.status(400).json({ message: "All registration fields, including OTP, are required" });
    }

    const refer = await Referred.findOne({ referrerUserId: userId });
    if (!refer) {
      // If no Referred record, still allow registration (we can create one or proceed)
      console.warn("[registerWithReferral] no Referred record for userId:", userId);
      // Optionally: create minimal Referred doc here or proceed — we'll proceed and not block.
    }

    const phoneOTPEntry = await Otp.findOne({ otpfor: phoneNo.toString(), type: "phone" });
    if (!phoneOTPEntry) return res.status(400).json({ message: "Phone OTP not found or expired" });

    const isPhoneOTPValid = await bcrypt.compare(phoneOTP.toString().trim(), phoneOTPEntry.otp);
    if (!isPhoneOTPValid) return res.status(400).json({ message: "Invalid Phone OTP" });

    const existEmail = await Student.findOne({ mail_ID });
    if (existEmail) return res.status(400).json({ message: "Email already registered" });

    // Auto-generate student_ID
    let nextNumber = 1;
    const allStudents = await Student.find({}, { student_ID: 1 }).lean();
    const usedNumbers = new Set();
    allStudents.forEach((s) => {
      const match = s.student_ID && s.student_ID.match(/(\d{4})$/);
      if (match) usedNumbers.add(parseInt(match[1], 10));
    });
    while (usedNumbers.has(nextNumber)) nextNumber++;
    const student_ID = `RCR-RSR-${nextNumber.toString().padStart(4, "0")}`;

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

    // Update or create Referred record to reflect referred student (if exist)
    let referralRecord = null;
    try {
      referralRecord = await Referred.findOneAndUpdate(
        { referrerUserId: userId },
        {
          $set: {
            referredStudentId: newStudent._id,
            referredName: fullName,
            referredEmail: mail_ID,
            referredPhone: phoneNo,
            collegeName: college,
            year: year,
            referredDate: new Date(),
          },
        },
        { new: true, upsert: false }
      );
    } catch (e) {
      console.warn("[registerWithReferral] could not update Referred record:", e?.message || e);
    }

    const recipientEmail = (mail_ID || newStudent?.mail_ID || "").toString().trim();
    if (recipientEmail) {
      try {
        await sendReferralConfirmationEmail(recipientEmail, fullName, {
          referrerStudentID: (refer && refer.referrerStudentID) || userId || "-",
          rsatId: student_ID,
          dob: newStudent?.dob ?? dob,
          testDate: process.env.RSAT_TEST_DATE || "19th Jan 2026",
          venue: process.env.RSAT_VENUE || "RICR Campus - Minal Mall, 4th Floor, Minal Residency, JK Road, Bhopal (462023)",
        });
      } catch (mailErr) {
        console.error("[registerWithReferral] sendReferralConfirmationEmail ERROR:", mailErr?.message || mailErr);
      }
    }

    if (mail_ID) {
      try {
        await sendCredentialsEmail(mail_ID, fullName, student_ID);
      } catch (emailErr) {
        console.error("Failed to send credentials email:", emailErr);
      }
    }

    const token = generateAuthToken(newStudent, null, res);

    return res.status(201).json({
      message: "Registration successful, referral recorded, and confirmation email sent (if available).",
      student: newStudent,
      referral: referralRecord,
      token,
    });
  } catch (err) {
    next(err);
  }
};
