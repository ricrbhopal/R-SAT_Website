// server/src/controller/callerController.js
import mongoose from "mongoose";
import Caller from "../models/callerModel.js";
// import Student from "../models/StudentModel.js";
import Referred from "../models/refferedModel.js";
import AdmitCard from "../models/admitCardmodel.js";
import Demo from "../models/demoModel.js";
import Result from "../models/resultModel.js";

/**
 * Helper: normalize phone (digits only)
 */
function normalizePhone(p = "") {
  if (!p) return "";
  return String(p).replace(/\D/g, "");
}

/**
 * Robust lookup for admit/demo/result documents using multiple candidate keys:
 * - IDs (studentId, student_ID, student)
 * - emails (mail_ID, email, ApplicantEmail, applicantEmail)
 * - phone variants (contact, phone, phoneNo)
 *
 * Returns { admit, demo, result } (each may be null)
 */
async function findSupportDocs({ student, referred }) {
  const emailCandidates = new Set();
  const phoneCandidates = new Set();
  const idCandidates = new Set();

  if (student && student._id) idCandidates.add(String(student._id));
  if (referred?.referredStudentId) idCandidates.add(String(referred.referredStudentId));

  if (referred?.referredEmail) emailCandidates.add(String(referred.referredEmail).toLowerCase());
  if (student?.mail_ID) emailCandidates.add(String(student.mail_ID).toLowerCase());

  if (referred?.referredPhone) phoneCandidates.add(normalizePhone(referred.referredPhone));
  if (student?.phoneNo) phoneCandidates.add(normalizePhone(student.phoneNo));

  let admit = null;
  let demo = null;
  let result = null;

  // 1) Try by student id candidates (multiple field names)
  for (const sid of idCandidates) {
    if (!sid) continue;
    // Admit & Demo often store studentId
    try {
      admit = admit || (await AdmitCard.findOne({ studentId: sid }).lean());
    } catch (e) {
      // ignore
    }
    try {
      demo = demo || (await Demo.findOne({ studentId: sid }).lean());
    } catch (e) {
      // ignore
    }

    // Result: try several common field names
    if (!result) {
      try {
        result =
          (await Result.findOne({ $or: [{ studentId: sid }, { student_ID: sid }, { student: sid }, { student_id: sid }] }).lean()) ||
          null;
      } catch (e) {
        // ignore
      }
    }

    if (admit && demo && result) break;
  }

  // 2) Try by email candidates
  for (const em of emailCandidates) {
    if (!em) continue;

    try {
      admit = admit || (await AdmitCard.findOne({ $or: [{ email: em }, { mail_ID: em }, { ApplicantEmail: em }, { applicantEmail: em }] }).lean());
    } catch (e) {}

    try {
      demo = demo || (await Demo.findOne({ $or: [{ email: em }, { mail_ID: em }] }).lean());
    } catch (e) {}

    if (!result) {
      try {
        result = (await Result.findOne({ $or: [{ email: em }, { mail_ID: em }, { ApplicantEmail: em }, { applicantEmail: em }] }).lean()) || null;
      } catch (e) {}
    }

    if (admit && demo && result) break;
  }

  // 3) Try by phone candidates (use regex to match partials / +91 etc)
  for (const ph of phoneCandidates) {
    if (!ph) continue;
    const phoneRegex = new RegExp(ph);

    try {
      admit = admit || (await AdmitCard.findOne({ $or: [{ contact: { $regex: phoneRegex } }, { phone: { $regex: phoneRegex } }] }).lean());
    } catch (e) {}

    try {
      demo = demo || (await Demo.findOne({ $or: [{ phone: { $regex: phoneRegex } }, { contact: { $regex: phoneRegex } }] }).lean());
    } catch (e) {}

    if (!result) {
      try {
        result = (await Result.findOne({ $or: [{ phone: { $regex: phoneRegex } }, { contact: { $regex: phoneRegex } }, { phoneNo: { $regex: phoneRegex } }] }).lean()) || null;
      } catch (e) {}
    }

    if (admit && demo && result) break;
  }

  return { admit, demo, result };
}

/**
 * Build rows from Referred docs (fallback when Caller collection empty)
 * Returns: { total, items } where items: [{ referred, student, admitCard, demoClass, result }]
 */
async function buildFromReferred({ filter = {}, skip = 0, limit = 20 } = {}) {
  const referredDocs = await Referred.find(filter).sort({ createdAt: -1 }).lean();
  const total = referredDocs.length;
  const pageDocs = referredDocs.slice(skip, skip + limit);

  const items = await Promise.all(
    pageDocs.map(async (ref) => {
      // Try to find student associated with this referred record
      let student = null;
      if (ref.referredStudentId && mongoose.Types.ObjectId.isValid(String(ref.referredStudentId))) {
        student = await Student.findById(ref.referredStudentId)
          .select("_id student_ID fullName phoneNo mail_ID college branch year dob createdAt updatedAt")
          .lean();
      }

      if (!student && ref.referredEmail) {
        student = await Student.findOne({ mail_ID: String(ref.referredEmail).toLowerCase() })
          .select("_id student_ID fullName phoneNo mail_ID college branch year dob createdAt updatedAt")
          .lean();
      }
      if (!student && ref.referredPhone) {
        const norm = normalizePhone(ref.referredPhone);
        if (norm) student = await Student.findOne({ phoneNo: { $regex: new RegExp(norm) } })
          .select("_id student_ID fullName phoneNo mail_ID college branch year dob createdAt updatedAt")
          .lean();
      }

      // Now find support docs using robust lookup
      const { admit, demo, result } = await findSupportDocs({ student, referred: ref });

      return {
        referred: ref,
        student,
        admitCard: admit,
        demoClass: demo,
        result,
      };
    })
  );

  return { total, items };
}

/**
 * GET /api/callers
 * Query params supported:
 *  - page, perPage
 *  - referrerUserId / userId / ref
 *  - forceFallback=true (to use Referred collection)
 */
export const listCallers = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || "1", 10));
    const perPage = Math.min(200, parseInt(req.query.perPage || req.query.limit || "20", 10));
    const skip = (page - 1) * perPage;

    const callersCount = await Caller.countDocuments();
    const referredCount = await Referred.countDocuments();
    console.log(`[listCallers] counts -> Caller:${callersCount} Referred:${referredCount}`);

    const referrerUserId = req.query.referrerUserId || req.query.userId || req.query.ref;
    const forceFallback = req.query.forceFallback === "true";

    // If Caller docs exist and not forced -> use Caller find/populate (ensure populate keys match schema)
    if (callersCount > 0 && !forceFallback) {
      const filter = {};
      if (req.query.adminId && mongoose.Types.ObjectId.isValid(req.query.adminId)) filter.admin_ID = req.query.adminId;
      if (req.query.studentId && mongoose.Types.ObjectId.isValid(req.query.studentId)) {
        filter.student_ID = req.query.studentId;
      }

      console.log("Filter applied:", filter);

      // Fetch callers with common populate fields
      const callers = await Caller.find(filter)
        .skip(skip)
        .limit(perPage)
        .sort({ createdAt: -1 })
        .populate("student_ID", "_id student_ID fullName phoneNo mail_ID college branch year dob createdAt updatedAt")
        .populate(
          "reffered_ID",
          "_id referrerUserId referrerStudentID referredName referredEmail referredPhone collegeName year referredStudentId referrerId referredDate createdAt updatedAt"
        )
        .populate(
          "admitCard_ID",
          "_id studentId ApplicantName contact college branch year RSAT venue examDate examTime ReportingTime present downloadCount emailSent emailError createdAt updatedAt"
        )
        .populate("demoClass_ID", "_id studentName email phone collegeName year demoSlot type createdAt updatedAt")
        // attempt to populate result; depending on schema this may or may not populate
        .populate("result", "_id student_ID studentId A B C D total percentage scholarShip check createdAt updatedAt")
        .lean();

      console.log("Callers fetched (after populate):", JSON.stringify(callers, null, 2));

      // FIXUP: for any caller that still has result === null, try an explicit lookup using student or referred ids/emails/phones
      for (let i = 0; i < callers.length; i++) {
        const caller = callers[i];

        // skip if already present
        if (caller.result) continue;

        // Try various candidate identifiers
        const studentDoc = caller.student_ID || caller.student || null;
        const referredDoc = caller.reffered_ID || caller.referred || null;

        const candidateIds = new Set();
        if (studentDoc && studentDoc._id) candidateIds.add(String(studentDoc._id));
        if (studentDoc && studentDoc.student_ID) candidateIds.add(String(studentDoc.student_ID));
        if (referredDoc && referredDoc.referredStudentId) candidateIds.add(String(referredDoc.referredStudentId));
        if (referredDoc && referredDoc.referredStudentId) candidateIds.add(String(referredDoc.referredStudentId));

        const emails = new Set();
        if (studentDoc && studentDoc.mail_ID) emails.add(String(studentDoc.mail_ID).toLowerCase());
        if (referredDoc && referredDoc.referredEmail) emails.add(String(referredDoc.referredEmail).toLowerCase());

        const phones = new Set();
        if (studentDoc && studentDoc.phoneNo) phones.add(normalizePhone(studentDoc.phoneNo));
        if (referredDoc && referredDoc.referredPhone) phones.add(normalizePhone(referredDoc.referredPhone));

        let foundResult = null;

        // id based lookup
        for (const sid of candidateIds) {
          if (!sid) continue;
          try {
            foundResult = await Result.findOne({ $or: [{ studentId: sid }, { student_ID: sid }, { student: sid }, { student_id: sid }] }).lean();
          } catch (e) {
            foundResult = null;
          }
          if (foundResult) break;
        }

        // email based lookup
        if (!foundResult) {
          for (const em of emails) {
            if (!em) continue;
            try {
              foundResult = await Result.findOne({
                $or: [{ email: em }, { mail_ID: em }, { ApplicantEmail: em }, { applicantEmail: em }],
              }).lean();
            } catch (e) {
              foundResult = null;
            }
            if (foundResult) break;
          }
        }

        // phone based lookup (regex)
        if (!foundResult) {
          for (const ph of phones) {
            if (!ph) continue;
            const rx = new RegExp(ph);
            try {
              foundResult = await Result.findOne({
                $or: [{ phone: { $regex: rx } }, { contact: { $regex: rx } }, { phoneNo: { $regex: rx } }],
              }).lean();
            } catch (e) {
              foundResult = null;
            }
            if (foundResult) break;
          }
        }

        if (foundResult) {
          caller.result = foundResult;
        }
      }

      const total = await Caller.countDocuments(filter);
      return res.status(200).json({
        success: true,
        total,
        page,
        perPage,
        count: callers.length,
        data: callers,
      });
    }

    // Fallback: build rows from Referred collection (robust multi-key lookup)
    const referredFilter = {};
    if (referrerUserId && mongoose.Types.ObjectId.isValid(referrerUserId)) referredFilter.referrerUserId = referrerUserId;

    const { total, items } = await buildFromReferred({ filter: referredFilter, skip, limit: perPage });

    return res.status(200).json({
      success: true,
      total,
      page,
      perPage,
      count: items.length,
      data: items,
    });
  } catch (err) {
    console.error("[listCallers] ERROR:", err);
    next(err);
  }
};
