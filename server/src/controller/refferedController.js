// controllers/referralController.js
import crypto from "crypto";
import Referred from "../models/refferedModel.js";
import Student from "../models/authModel.js";

/**
 * Create referral record and return link (authenticated endpoint)
 * POST /api/referrals/create
 * body: optional { referredName, referredEmail, referredPhone, collegeName, year }
 */
export const createReferral = async (req, res, next) => {
  try {
    const referrer = req.user;
    if (!referrer) return res.status(401).json({ message: "Unauthorized" });

    const { referredName, referredEmail, referredPhone, collegeName, year } = req.body;

    // Generate unique refCode (retry on collision)
    let refCode;
    for (let attempt = 0; attempt < 5; attempt++) {
      refCode = crypto.randomBytes(6).toString("hex"); // 12 chars
      const exists = await Referred.findOne({ refCode });
      if (!exists) break;
      refCode = null;
    }
    if (!refCode) {
      return res.status(500).json({ message: "Could not generate unique referral code. Try again." });
    }

    // Best-effort to find referrer's student_ID string
    const referrerStudentID =
      referrer.student_ID || referrer.studentId || referrer.student_id || null;

    const newRef = await Referred.create({
      referrerId: referrer._id,
      referrerUserId: referrer._id,
      referrerStudentID: referrerStudentID,
      referredName: referredName || "",
      referredEmail: referredEmail || "",
      referredPhone: referredPhone || "",
      collegeName: collegeName || "",
      year: year || "",
      refCode,
    });

    // Build frontend link including refCode and referrer's student_ID (if available)
    const frontendBase = process.env.FRONTEND_URL || "http://localhost:5173";
    const link = `${frontendBase}/candidateDashboard/RefferedRegisterationPage?ref=${encodeURIComponent(
      refCode
    )}${referrerStudentID ? `&studentId=${encodeURIComponent(referrerStudentID)}` : ""}`;

    res.status(201).json({
      message: "Referral created",
      ref: newRef,
      referralLink: link,
    });
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
    const refer = await Referred.findOne({ refCode: code }).populate(
      "referrerId",
      "student_ID fullName mail_ID phoneNo"
    );
    if (!refer) return res.status(404).json({ message: "Referral not found" });

    res.status(200).json({
      referrer: {
        // return both the referenced user object id and the explicit stored values
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
 * Register via referral (public)
 * POST /api/referrals/register?ref=REFCODE
 * body: { student_ID(optional), fullName, phoneNo, mail_ID, college, branch, year, dob }
 */
export const registerWithReferral = async (req, res, next) => {
  try {
    const { ref } = req.query;
    if (!ref) return res.status(400).json({ message: "Referral code missing" });

    const {
      fullName,
      phoneNo,
      mail_ID,
      college,
      branch,
      year,
      dob,
    } = req.body;

    // Basic validation
    if (!fullName || !phoneNo || !mail_ID || !college || !branch || !year || !dob) {
      return res.status(400).json({ message: "All registration fields are required" });
    }

    // Ensure email uniqueness
    const existEmail = await Student.findOne({ mail_ID });
    if (existEmail) return res.status(400).json({ message: "Email already registered" });

    // Generate unique student_ID (defensive)
    const lastStudent = await Student.findOne().sort({ createdAt: -1 });
    const lastIdNumberSegment = lastStudent?.student_ID?.split("-")[2] ?? "0000";
    const lastIdNumber = parseInt(lastIdNumberSegment, 10);
    const nextNumber = Number.isFinite(lastIdNumber) ? lastIdNumber + 1 : 1;
    const newIdNumber = nextNumber.toString().padStart(4, "0");
    const student_ID = `RCR-RSR-${newIdNumber}`;

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

    // Try to update referral record that is unused (referredStudentId is null)
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

    if (!referralRecord) {
      // referral code was invalid or already used
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
    next(err);
  }
};
