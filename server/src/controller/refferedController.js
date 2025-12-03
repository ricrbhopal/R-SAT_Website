// server/src/controller/refferedController.js
import mongoose from "mongoose";
import Referred from "../models/refferedModel.js";
import Student from "../models/StudentModel.js";
import Admin from "../models/AdminModel.js"; // adjust if your Admin model path/name differs
import { generateAuthToken } from "../utils/genAuthToken.js";
import { sendOTPPhone } from "../utils/phoneService.js";
import { sendCredentialsEmail, sendReferralConfirmationEmail } from "../utils/emailService.js";
import bcrypt from "bcryptjs";
import Otp from "../models/otpModel.js";

/**
 * Helper: try populating a Referred doc with possible referrer sources
 */
async function populateReferredDoc(doc) {
  if (!doc) return null;
  // reload and populate both possible referrer relations
  const populated = await Referred.findById(doc._id)
    .populate("referrerId", "student_ID fullName mail_ID phoneNo")
    .populate("referrerCallerId", "username role phone createdAt")
    .lean();
  return populated;
}

/**
 * POST /api/referrals/send-otp
 * body: { phoneNo, ref? }
 */
export const sendReferralOTP = async (req, res, next) => {
  try {
    const { phoneNo, ref } = req.body;
    console.log("[sendReferralOTP] phoneNo:", phoneNo, "ref:", ref);
    if (!phoneNo) return res.status(400).json({ message: "phoneNo is required" });

    if (ref) {
      try {
        const found = await Referred.findOne({
          $or: [{ referrerUserId: ref }, { referrerCallerId: ref }, { refCode: ref }],
        }).lean();
        console.log("[sendReferralOTP] found referred record for ref?:", Boolean(found));
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
      console.error("[sendReferralOTP] sendOTPPhone error:", smsErr);
      return res.status(502).json({ message: "Failed to send OTP. Try again later." });
    }

    const hashed = await bcrypt.hash(phoneOTP, 10);
    await Otp.create({
      otpfor: phoneNo.toString(),
      otp: hashed,
      type: "phone",
      createdAt: new Date(),
    });

    console.log("[sendReferralOTP] OTP created for:", phoneNo);
    return res.status(200).json({ message: "OTP sent successfully" });
  } catch (err) {
    console.error("[sendReferralOTP] ERROR:", err);
    next(err);
  }
};

/**
 * POST /api/referrals/create  (auth required)
 * If req.user is admin/caller => create referral with referrerCallerId
 * Else create with referrerUserId
 */
export const createReferral = async (req, res, next) => {
  try {
    const referrer = req.user;
    console.log("[createReferral] req.user:", referrer && { id: referrer._id, role: referrer.role });
    if (!referrer) return res.status(401).json({ message: "Unauthorized: login required to create referral" });

    const role = String(referrer.role || "").toLowerCase();
    const isAdminOrCaller = ["admin", "caller", "manager"].includes(role) || referrer.isAdmin === true;

    const referrerUserId = isAdminOrCaller ? null : String(referrer._id);
    const referrerCallerId = isAdminOrCaller ? String(referrer._id) : null;

    console.log("[createReferral] isAdminOrCaller:", isAdminOrCaller, "referrerUserId:", referrerUserId, "referrerCallerId:", referrerCallerId);

    // Check existing by either referrerUserId or referrerCallerId
    let existing = null;
    if (referrerUserId) existing = await Referred.findOne({ referrerUserId }).lean();
    else if (referrerCallerId) existing = await Referred.findOne({ referrerCallerId }).lean();

    if (existing) {
      console.log("[createReferral] existing referral found:", existing._id);
      const frontendBase = (process.env.FRONTEND_URL && process.env.FRONTEND_URL.trim()) || "https://rsat.ricr.in";
      let referralLink = "";
      if (referrerCallerId) {
        referralLink = `${frontendBase.replace(/\/+$/, "")}/callerDashboard/RefferedRegisterationPage?admin_ID=${encodeURIComponent(referrerCallerId)}`;
      } else {
        referralLink = `${frontendBase.replace(/\/+$/, "")}/candidateDashboard/RefferedRegisterationPage?userId=${encodeURIComponent(referrerUserId)}`;
      }
      const populated = await populateReferredDoc(existing);
      return res.status(200).json({ message: "Referral exists", ref: populated || existing, referralLink });
    }

    const { referredName, referredEmail, referredPhone, collegeName, year } = req.body || {};

    // Build payload and set refCode to whatever id we will use (user or caller) so it's not null.
    const payload = {
      referrerUserId: referrerUserId || undefined,
      referrerCallerId: referrerCallerId || undefined,
      referrerStudentID: (!isAdminOrCaller && (referrer.student_ID || referrer.studentId || referrer.student_id)) || null,
      referredName: referredName || "",
      referredEmail: referredEmail || "",
      referredPhone: referredPhone || "",
      collegeName: collegeName || "",
      year: year || "",
      // ensure refCode non-null for new docs
      refCode: (referrerUserId || referrerCallerId) ? String(referrerUserId || referrerCallerId) : undefined,
    };
    Object.keys(payload).forEach((k) => (payload[k] === undefined ? delete payload[k] : null));
    console.log("[createReferral] payload prepared:", payload);

    let newRef;
    try {
      newRef = await Referred.create(payload);
      console.log("[createReferral] created new Referred doc with id:", newRef._id);
    } catch (createErr) {
      console.error("[createReferral] create error:", createErr);
      if (createErr.name === "ValidationError") return res.status(400).json({ message: "Invalid referral data", details: createErr.errors });
      if (createErr.code === 11000) return res.status(409).json({ message: "Duplicate referral detected", key: createErr.keyValue });
      return res.status(500).json({ message: "Failed to create referral", error: createErr.message });
    }

    const frontendBase = (process.env.FRONTEND_URL && process.env.FRONTEND_URL.trim()) || "https://rsat.ricr.in";
    let referralLink = "";
    if (referrerCallerId) {
      referralLink = `${frontendBase.replace(/\/+$/, "")}/callerDashboard/RefferedRegisterationPage?admin_ID=${encodeURIComponent(referrerCallerId)}`;
    } else {
      referralLink = `${frontendBase.replace(/\/+$/, "")}/candidateDashboard/RefferedRegisterationPage?userId=${encodeURIComponent(referrerUserId)}`;
    }

    const populated = await populateReferredDoc(newRef);
    return res.status(201).json({ message: "Referral created", ref: populated || newRef, referralLink });
  } catch (err) {
    console.error("[createReferral] unexpected:", err && err.stack ? err.stack : err);
    return res.status(500).json({ message: "Server error while creating referral" });
  }
};

/**
 * GET /api/referrals/info/:code
 * Lookup order:
 *  - refCode
 *  - referrerUserId
 *  - referrerCallerId
 *  - referrerId (legacy)
 *  - Student.findById
 *  - Admin.findById
 */
export const getReferralInfo = async (req, res, next) => {
  try {
    const { code } = req.params;
    if (!code) return res.status(400).json({ message: "Referral code is required" });

    console.log("[getReferralInfo] code:", code);

    // 1) by refCode
    let refer = await Referred.findOne({ refCode: code })
      .populate("referrerId", "student_ID fullName mail_ID phoneNo")
      .populate("referrerCallerId", "username role phone createdAt")
      .lean();
    if (refer) {
      console.log("[getReferralInfo] found by refCode:", refer._id);
      const resp = {
        referrer: {
          id: refer.referrerCallerId ?? refer.referrerId?._id ?? null,
          name: refer.referrerCallerId ? (refer.referrerCallerId.username || null) : (refer.referrerId?.fullName ?? refer.referrerStudentID ?? null),
          student_ID: refer.referrerStudentID ?? refer.referrerId?.student_ID ?? null,
          userId: refer.referrerUserId ?? refer.referrerCallerId ?? refer.referrerId?._id ?? null,
          type: refer.referrerCallerId ? "caller" : "student",
        },
        referredName: refer.referredName || null,
        referredEmail: refer.referredEmail || null,
        referredPhone: refer.referredPhone || null,
        collegeName: refer.collegeName || null,
        year: refer.year || null,
      };
      return res.status(200).json(resp);
    }

    // 2) by referrerUserId
    refer = await Referred.findOne({ referrerUserId: code })
      .populate("referrerId", "student_ID fullName mail_ID phoneNo")
      .lean();
    if (refer) {
      console.log("[getReferralInfo] found by referrerUserId:", refer._id);
      return res.status(200).json({
        referrer: {
          id: refer.referrerId?._id ?? null,
          name: refer.referrerId?.fullName ?? refer.referrerStudentID ?? null,
          student_ID: refer.referrerStudentID ?? refer.referrerId?.student_ID ?? null,
          userId: refer.referrerUserId ?? refer.referrerId?._id ?? null,
          type: "student",
        },
        referredName: refer.referredName || null,
        referredEmail: refer.referredEmail || null,
        referredPhone: refer.referredPhone || null,
        collegeName: refer.collegeName || null,
        year: refer.year || null,
      });
    }

    // 3) by referrerCallerId
    refer = await Referred.findOne({ referrerCallerId: code })
      .populate("referrerCallerId", "username role phone createdAt")
      .lean();
    if (refer) {
      console.log("[getReferralInfo] found by referrerCallerId:", refer._id);
      return res.status(200).json({
        referrer: {
          id: refer.referrerCallerId?._id ?? null,
          name: refer.referrerCallerId?.username ?? null,
          role: refer.referrerCallerId?.role ?? null,
          phone: refer.referrerCallerId?.phone ?? null,
          userId: refer.referrerCallerId?._id ?? null,
          type: "caller",
        },
        referredName: refer.referredName || null,
        referredEmail: refer.referredEmail || null,
        referredPhone: refer.referredPhone || null,
        collegeName: refer.collegeName || null,
        year: refer.year || null,
      });
    }

    // 4) legacy referrerId or fallbacks
    if (mongoose.Types.ObjectId.isValid(code)) {
      refer = await Referred.findOne({ referrerId: code })
        .populate("referrerId", "student_ID fullName mail_ID phoneNo")
        .lean();
      if (refer) {
        console.log("[getReferralInfo] found by referrerId (legacy):", refer._id);
        return res.status(200).json({
          referrer: {
            id: refer.referrerId?._id ?? null,
            name: refer.referrerId?.fullName ?? refer.referrerStudentID ?? null,
            student_ID: refer.referrerStudentID ?? refer.referrerId?.student_ID ?? null,
            userId: refer.referrerUserId ?? refer.referrerId?._id ?? null,
            type: "student",
          },
          referredName: refer.referredName || null,
          referredEmail: refer.referredEmail || null,
          referredPhone: refer.referredPhone || null,
          collegeName: refer.collegeName || null,
          year: refer.year || null,
        });
      }

      // 5) fallback synthesize from Student collection
      const student = await Student.findById(code, "student_ID fullName mail_ID phoneNo").lean();
      if (student) {
        console.log("[getReferralInfo] synthesize from Student:", student._id);
        return res.status(200).json({
          referrer: {
            id: student._id || null,
            name: student.fullName || null,
            student_ID: student.student_ID || null,
            userId: student._id || null,
            type: "student",
          },
          referredName: null,
          referredEmail: null,
          referredPhone: null,
          collegeName: null,
          year: null,
        });
      }

      // 6) fallback synthesize from Admin collection
      const admin = await Admin.findById(code, "username role phone").lean();
      if (admin) {
        console.log("[getReferralInfo] synthesize from Admin:", admin._id);
        return res.status(200).json({
          referrer: {
            id: admin._id || null,
            name: admin.username || null,
            role: admin.role || null,
            phone: admin.phone || null,
            userId: admin._id || null,
            type: "caller",
          },
          referredName: null,
          referredEmail: null,
          referredPhone: null,
          collegeName: null,
          year: null,
        });
      }
    }

    console.warn("[getReferralInfo] referral not found for code:", code);
    return res.status(404).json({ message: "Referral not found" });
  } catch (err) {
    console.error("[getReferralInfo] ERROR:", err && err.stack ? err.stack : err);
    next(err);
  }
};

/**
 * POST /api/referrals/register?userId=REFUSERID
 * userId may be a Student._id OR Admin._id (caller) OR refCode
 */
export const registerWithReferral = async (req, res, next) => {
  try {
    const { userId } = req.query;
    console.log("[registerWithReferral] userId param:", userId);
    if (!userId) return res.status(400).json({ message: "Referral userId missing" });

    const { fullName, phoneNo, mail_ID, college, branch, year, dob, phoneOTP } = req.body;
    console.log("[registerWithReferral] body:", { fullName, phoneNo, mail_ID, college, branch, year, dob });
    if (!fullName || !phoneNo || !mail_ID || !college || !branch || !year || !dob || !phoneOTP) {
      return res.status(400).json({ message: "All registration fields, including OTP, are required" });
    }

    // Find existing referred doc by either referrerUserId, referrerCallerId or refCode
    let refer = await Referred.findOne({
      $or: [{ referrerUserId: userId }, { referrerCallerId: userId }, { refCode: userId }],
    }).lean();
    console.log("[registerWithReferral] initial refer found?:", Boolean(refer), refer && refer._id);

    // Validate OTP exists
    const phoneOTPEntry = await Otp.findOne({ otpfor: phoneNo.toString(), type: "phone" });
    if (!phoneOTPEntry) {
      console.warn("[registerWithReferral] phone OTP entry missing for:", phoneNo);
      return res.status(400).json({ message: "Phone OTP not found or expired" });
    }

    const isPhoneOTPValid = await bcrypt.compare(phoneOTP.toString().trim(), phoneOTPEntry.otp);
    if (!isPhoneOTPValid) {
      console.warn("[registerWithReferral] invalid OTP for phone:", phoneNo);
      return res.status(400).json({ message: "Invalid Phone OTP" });
    }

    // Email must be unique
    const existEmail = await Student.findOne({ mail_ID });
    if (existEmail) {
      console.warn("[registerWithReferral] email already exists:", mail_ID);
      return res.status(400).json({ message: "Email already registered" });
    }

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

    // Create new Student (referred)
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
    console.log("[registerWithReferral] created new Student:", newStudent._id);

    // remove OTP entries for phone
    await Otp.deleteMany({ otpfor: phoneNo.toString(), type: "phone" });

    // If refer not exists, attempt to figure out whether userId is Student or Admin and create a Referred doc
    let referrerStudent = null;
    let referrerAdmin = null;
    if (!refer) {
      if (mongoose.Types.ObjectId.isValid(userId)) {
        try { referrerStudent = await Student.findById(userId).lean(); } catch (e) { console.warn("[registerWithReferral] Student lookup failed:", e?.message || e); }
        if (!referrerStudent) {
          try { referrerAdmin = await Admin.findById(userId).lean(); } catch (e) { console.warn("[registerWithReferral] Admin lookup failed:", e?.message || e); }
        }
      } else {
        // userId might be a refCode string (non ObjectId)
        console.log("[registerWithReferral] userId not ObjectId - treating as refCode");
      }
    } else {
      if (refer.referrerUserId) {
        try { referrerStudent = await Student.findById(refer.referrerUserId).lean(); } catch (e) { /* ignore */ }
      }
      if (refer.referrerCallerId) {
        try { referrerAdmin = await Admin.findById(refer.referrerCallerId).lean(); } catch (e) { /* ignore */ }
      }
    }

    console.log("[registerWithReferral] referrerStudent:", !!referrerStudent, "referrerAdmin:", !!referrerAdmin);

    // Prepare update and upsert accordingly
    const updateFields = {
      referredStudentId: newStudent._id,
      referredName: fullName,
      referredEmail: mail_ID,
      referredPhone: phoneNo,
      collegeName: college,
      year: year,
      referredDate: new Date(),
    };

    const setOnInsert = {
      referrerUserId: refer?.referrerUserId ?? (referrerStudent ? String(referrerStudent._id) : undefined),
      referrerCallerId: refer?.referrerCallerId ?? (referrerAdmin ? String(referrerAdmin._id) : undefined),
      referrerId: referrerStudent?._id ?? null,
      referrerStudentID: referrerStudent?.student_ID ?? null,
      refCode: refer?.refCode ?? (referrerStudent ? String(referrerStudent._id) : (referrerAdmin ? String(referrerAdmin._id) : undefined)),
      createdAt: new Date(),
    };
    Object.keys(setOnInsert).forEach((k) => (setOnInsert[k] === undefined ? delete setOnInsert[k] : null));

    console.log("[registerWithReferral] updateFields:", updateFields, "setOnInsert:", setOnInsert);

    const query = { $or: [{ referrerUserId: userId }, { referrerCallerId: userId }, { refCode: userId }] };
    const referralRecordRaw = await Referred.findOneAndUpdate(
      query,
      { $set: updateFields, $setOnInsert: setOnInsert },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    // Ensure we return a populated doc
    const referralRecord = await populateReferredDoc(referralRecordRaw);
    console.log("[registerWithReferral] referralRecord after upsert:", referralRecord && referralRecord._id);

    // Send confirmation and credentials emails (best-effort)
    const recipientEmail = (mail_ID || newStudent?.mail_ID || "").toString().trim();
    if (recipientEmail) {
      try {
        await sendReferralConfirmationEmail(recipientEmail, fullName, {
          referrerStudentID: referralRecord?.referrerStudentID || referrerStudent?.student_ID || (referrerAdmin ? referrerAdmin.username : userId) || "-",
          rsatId: student_ID,
          dob: newStudent?.dob ?? dob,
          testDate: process.env.RSAT_TEST_DATE || "19th Jan 2026",
          venue: process.env.RSAT_VENUE || "RICR Campus - Minal Mall, 4th Floor, Minal Residency, JK Road, Bhopal (462023)",
        });
        console.log("[registerWithReferral] sendReferralConfirmationEmail ok");
      } catch (mailErr) {
        console.error("[registerWithReferral] sendReferralConfirmationEmail ERROR:", mailErr?.message || mailErr);
      }
    }
    if (mail_ID) {
      try {
        await sendCredentialsEmail(mail_ID, fullName, student_ID);
        console.log("[registerWithReferral] sendCredentialsEmail ok");
      } catch (emailErr) {
        console.error("[registerWithReferral] sendCredentialsEmail ERROR:", emailErr);
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
    console.error("[registerWithReferral] ERROR:", err && err.stack ? err.stack : err);
    next(err);
  }
};
