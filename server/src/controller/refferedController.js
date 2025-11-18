// controllers/referralController.js
import crypto from "crypto";
import Referred from "../models/refferedModel.js";
import Student from "../models/authModel.js";

/**
 * Create referral record and return link (authenticated endpoint)
 * POST /api/referrals/create
 * body: optional { referredName, referredEmail, referredPhone }
 */
export const createReferral = async (req, res, next) => {
  try {
    // req.user must exist (auth middleware)
    const referrer = req.user;
    if (!referrer) return res.status(401).json({ message: "Unauthorized" });

    const { referredName, referredEmail, referredPhone, collegeName, year } = req.body;

    // Generate unique refCode
    const refCode = crypto.randomBytes(6).toString("hex"); // 12 chars

    const newRef = await Referred.create({
      referrerId: referrer._id,
      referredName: referredName || "",
      referredEmail: referredEmail || "",
      referredPhone: referredPhone || "",
      collegeName: collegeName || "",
      year: year || "",
      refCode,
    });

    // Construct frontend link (change domain to your frontend domain)
    const frontendBase = process.env.FRONTEND_URL || "http://localhost:5173";
    const link = `${frontendBase}/register?ref=${refCode}`;

    res.status(201).json({ message: "Referral created", ref: newRef, referralLink: link });
  } catch (err) {
    next(err);
  }
};

/**
 * Get referral info for prefill (public)
 * GET /api/referrals/info/:code
 * returns basic info stored against code (if any)
 */
export const getReferralInfo = async (req, res, next) => {
  try {
    const { code } = req.params;
    const refer = await Referred.findOne({ refCode: code }).populate("referrerId", "student_ID fullName mail_ID phoneNo");
    if (!refer) return res.status(404).json({ message: "Referral not found" });
    // return limited info so frontend can prefill email/phone if present
    res.status(200).json({
      referrer: {
        id: refer.referrerId?._id,
        name: refer.referrerId?.fullName,
        student_ID: refer.referrerId?.student_ID,
      },
      referredName: refer.referredName,
      referredEmail: refer.referredEmail,
      referredPhone: refer.referredPhone,
      collegeName: refer.collegeName,
      year: refer.year,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Register via referral (public)
 * POST /api/referrals/register?ref=REFCODE
 * body: { student_ID, fullName, phoneNo, mail_ID, college, branch, year, dob }
 *
 * Flow:
 *  - Create Student
 *  - Find Referred by refCode and set referredStudentId to new student's _id and fill details
 */
export const registerWithReferral = async (req, res, next) => {
  try {
    const { ref } = req.query;
    console.log("Referral Code:", ref); // Debugging log
    console.log("Request Body:", req.body); // Debugging log

    if (!ref) return res.status(400).json({ message: "Referral code missing" });

    const {
      student_ID, fullName, phoneNo, mail_ID, college, branch, year, dob
    } = req.body;

    // Basic validation
    if (!student_ID || !fullName || !phoneNo || !mail_ID || !college || !branch || !year || !dob) {
      return res.status(400).json({ message: "All registration fields are required" });
    }

    // Ensure email/student_ID uniqueness
    const existEmail = await Student.findOne({ mail_ID });
    if (existEmail) return res.status(400).json({ message: "Email already registered" });
    const existStudentId = await Student.findOne({ student_ID });
    if (existStudentId) return res.status(400).json({ message: "Student_ID already exists" });

    const newStudent = await Student.create({
      student_ID,
      fullName,
      phoneNo,
      mail_ID,
      college,
      branch,
      year,
      dob: new Date(dob),
    });

    console.log("New Student Created:", newStudent); // Debugging log

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

    console.log("Referral Record Updated:", referralRecord); // Debugging log

    if (!referralRecord) {
      return res.status(201).json({
        message: "Registration successful, but referral code was invalid or already used",
        student: newStudent,
      });
    }

    res.status(201).json({
      message: "Registration successful and referral recorded",
      student: newStudent,
      referral: referralRecord,
    });
  } catch (err) {
    console.error("Error in registerWithReferral:", err); // Debugging log
    next(err);
  }
};
