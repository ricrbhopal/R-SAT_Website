// server/src/controller/callerController.js
import mongoose from "mongoose";
import Caller from "../models/callerModel.js";
import Student from "../models/authModel.js";
import Referred from "../models/refferedModel.js";
import AdmitCard from "../models/admitCardmodel.js";
import Demo from "../models/demoModel.js";
import Result from "../models/resultModel.js";

/** Helper: normalize phone (digits only) */
function normalizePhone(p = "") {
  if (!p) return "";
  return String(p).replace(/\D/g, "");
}

/** Try to locate an admit/demo/result document given possible keys */
async function findSupportDocs({ student, referred }) {
  // student: may be null or object with _id, mail_ID, phoneNo
  // referred: Referred doc (may contain referredEmail, referredPhone, referredStudentId)
  const emailCandidates = new Set();
  const phoneCandidates = new Set();
  const idCandidates = new Set();

  if (student && student._id) idCandidates.add(String(student._id));
  if (referred?.referredStudentId) idCandidates.add(String(referred.referredStudentId));
  if (referred?.referredEmail) emailCandidates.add(String(referred.referredEmail).toLowerCase());
  if (student?.mail_ID) emailCandidates.add(String(student.mail_ID).toLowerCase());
  if (referred?.referredPhone) phoneCandidates.add(normalizePhone(referred.referredPhone));
  if (student?.phoneNo) phoneCandidates.add(normalizePhone(student.phoneNo));

  // Build queries (try by studentId first, then email, then phone)
  let admit = null;
  let demo = null;
  let result = null;

  // By studentId candidates
  for (const sid of idCandidates) {
    if (!sid || !mongoose.Types.ObjectId.isValid(sid)) continue;
    admit = admit || (await AdmitCard.findOne({ studentId: sid }).lean());
    demo = demo || (await Demo.findOne({ studentId: sid }).lean());
    result = result || (await Result.findOne({ studentId: sid }).lean());
    if (admit && demo && result) break;
  }

  // By email candidates
  for (const em of emailCandidates) {
    if (!em) continue;
    admit = admit || (await AdmitCard.findOne({ email: em }).lean());
    // some admit cards store mail in different field (try mail_ID or ApplicantEmail)
    if (!admit) admit = admit || (await AdmitCard.findOne({ mail_ID: em }).lean());
    demo = demo || (await Demo.findOne({ email: em }).lean());
    result = result || (await Result.findOne({ email: em }).lean());
    if (admit && demo && result) break;
  }

  // By phone candidates (normalized)
  for (const ph of phoneCandidates) {
    if (!ph) continue;
    // Admit card contact may include +91 etc; use regex contains digits sequence
    const phoneRegex = new RegExp(ph);
    admit = admit || (await AdmitCard.findOne({ contact: { $regex: phoneRegex } }).lean());
    demo = demo || (await Demo.findOne({ phone: { $regex: phoneRegex } }).lean());
    result = result || (await Result.findOne({ phone: { $regex: phoneRegex } }).lean());
    if (admit && demo && result) break;
  }

  return { admit, demo, result };
}

/** Build "rows" from Referred docs (fallback when Caller collection empty) */
async function buildFromReferred({ filter = {}, skip = 0, limit = 20 } = {}) {
  const referredDocs = await Referred.find(filter).sort({ createdAt: -1 }).lean();
  const total = referredDocs.length;
  const pageDocs = referredDocs.slice(skip, skip + limit);

  const items = await Promise.all(
    pageDocs.map(async (ref) => {
      // Try to find student associated with this referred record
      let student = null;
      if (ref.referredStudentId && mongoose.Types.ObjectId.isValid(String(ref.referredStudentId))) {
        student = await Student.findById(ref.referredStudentId).select("_id student_ID fullName phoneNo mail_ID college branch year dob createdAt updatedAt").lean();
      }

      // If not found, try by email or phone
      if (!student && ref.referredEmail) {
        student = await Student.findOne({ mail_ID: String(ref.referredEmail).toLowerCase() }).select("_id student_ID fullName phoneNo mail_ID college branch year dob createdAt updatedAt").lean();
      }
      if (!student && ref.referredPhone) {
        const norm = normalizePhone(ref.referredPhone);
        if (norm) student = await Student.findOne({ phoneNo: { $regex: new RegExp(norm) } }).select("_id student_ID fullName phoneNo mail_ID college branch year dob createdAt updatedAt").lean();
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
 * Accepts:
 *   ?page=1&perPage=20
 *   ?referrerUserId=...   // show referrals for a given referrer
 *   ?forceFallback=true   // build from Referred collection (useful when Caller collection empty)
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
      if (req.query.studentId && mongoose.Types.ObjectId.isValid(req.query.studentId)) filter.student_ID = req.query.studentId;
      // if referrerUserId provided, try to match callers by admin_ID or referenced referred doc later (could require aggregation)
      if (referrerUserId && mongoose.Types.ObjectId.isValid(referrerUserId)) filter.admin_ID = referrerUserId;

      // populate names according to your model field names (adjust if different)
      const callers = await Caller.find(filter).skip(skip).limit(perPage).sort({ createdAt: -1 })
        .populate("student_ID", "_id student_ID fullName phoneNo mail_ID college branch year dob createdAt updatedAt")
        .populate("reffered_ID", "_id referrerUserId referrerStudentID referredName referredEmail referredPhone collegeName year referredStudentId referrerId referredDate createdAt updatedAt")
        .populate("admitCard_ID", "_id studentId ApplicantName contact college branch year RSAT venue examDate examTime ReportingTime present downloadCount emailSent emailError createdAt updatedAt")
        .populate("demoClass_ID", "_id studentName email phone collegeName year demoSlot type createdAt updatedAt")
        .populate("result", "_id studentName email phone collegeName year score rank status createdAt updatedAt")
        .lean();

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

/**
 * POST /api/callers/backfill-admitcard
 * Admin-only helper: attempt to fix AdmitCard.studentId when it's pointing to referrer id
 * It will look for Referred -> referredStudentId or Student by email/phone and update the admit card.
 */
export const backfillAdmitCardStudentId = async (req, res, next) => {
  try {
    // Ensure admin
    if (!req.user || req.user.role !== "admin") return res.status(403).json({ success: false, message: "Admin only" });

    // Find admit cards whose studentId points to a user who is a known referrer (i.e., studentId matches any Referred.referrerUserId)
    const suspectAdmits = await AdmitCard.find({}).lean();
    let updatedCount = 0;
    const logs = [];

    for (const admit of suspectAdmits) {
      // if studentId is missing or is not a referred student's id, attempt to fix
      const sid = admit.studentId ? String(admit.studentId) : null;
      let shouldTryFix = true;

      if (sid && mongoose.Types.ObjectId.isValid(sid)) {
        // If admit.studentId corresponds to a real Student who also appears as referredStudent (OK) - skip
        const stud = await Student.findById(sid).lean();
        if (stud) {
          // check if this student id is the referred student present in Referred collection
          const ref = await Referred.findOne({ referredStudentId: sid }).lean();
          if (ref) shouldTryFix = false;
        }
      }

      if (!shouldTryFix) continue;

      // Try to locate correct student by email/phone matching admit
      let foundStudent = null;
      if (admit.email) foundStudent = await Student.findOne({ mail_ID: String(admit.email).toLowerCase() }).lean();
      if (!foundStudent && admit.contact) {
        foundStudent = await Student.findOne({ phoneNo: { $regex: new RegExp(normalizePhone(admit.contact)) } }).lean();
      }

      if (!foundStudent) {
        // try matching via Referred document: find referred doc with referredEmail / referredPhone matching admit
        const r = await Referred.findOne({
          $or: [
            { referredEmail: admit.email },
            { referredPhone: { $regex: new RegExp(normalizePhone(admit.contact || "")) } },
            { referredStudentId: admit.studentId },
          ],
        }).lean();
        if (r && r.referredStudentId) {
          foundStudent = await Student.findById(r.referredStudentId).lean();
        }
      }

      if (foundStudent) {
        await AdmitCard.updateOne({ _id: admit._id }, { $set: { studentId: foundStudent._id } });
        updatedCount++;
        logs.push({ admitId: admit._id, setTo: foundStudent._id });
      }
    }

    return res.status(200).json({ success: true, updatedCount, logs: logs.slice(0, 20) });
  } catch (err) {
    console.error("[backfillAdmitCardStudentId] ERROR:", err);
    next(err);
  }
};


