import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
import bcrypt from "bcryptjs";
import { sendOTPPhone } from "../utils/phoneService.js";
import { sendCredentialsEmail } from "../utils/emailService.js";
import { generateAuthToken } from "../utils/genAuthToken.js";
import { sendConfirmationEmail } from "../utils/emailService.js";
import streamifier from "streamifier";
import cloudinary from "../utils/couldinary.js"; 


/* Helper: Format DOB */
const formatDateDDMMYYYY = (d) => {
  const dt = new Date(d);
  const dd = String(dt.getDate()).padStart(2, "0");
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const yyyy = dt.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
};

/* ---------------- SEND OTP ---------------- */
export const SendOTP = async (req, res, next) => {
  try {
    const { fullName, phoneNo, email } = req.body;

    if (!fullName || !phoneNo)
      return res.status(400).json({ message: "Full name & phone required" });

    const existing = await prisma.student.findFirst({
      where: {
        OR: [{ phoneNo: phoneNo }, { mail_ID: email }],
      },
    });

    if (existing)
      return res.status(400).json({
        message: "User already exists with phone/email",
      });

    const phoneOTP = Math.floor(100000 + Math.random() * 900000).toString();

    await prisma.otp.deleteMany({
      where: { otpfor: phoneNo, type: "phone" },
    });

    await sendOTPPhone(phoneNo, phoneOTP);

    const hashed = await bcrypt.hash(phoneOTP, 10);

    await prisma.otp.create({
      data: {
        otpfor: phoneNo,
        otp: hashed,
        type: "phone",
      },
    });

    res.json({ message: "OTP sent successfully" });
  } catch (err) {
    next(err);
  }
};

/* ---------------- REGISTER ---------------- */
export const Register = async (req, res, next) => {
  try {
    const { fullName, phoneNo, phoneOTP, college, branch, year, dob, email } =
      req.body;

    if (!fullName || !phoneNo || !phoneOTP || !college || !branch || !year || !dob || !email)
      return res.status(400).json({ message: "All fields required" });

    // verify OTP
    const otpEntry = await prisma.otp.findFirst({
      where: { otpfor: phoneNo, type: "phone" },
    });

    if (!otpEntry)
      return res.status(400).json({ message: "Phone OTP expired" });

    const validOtp = await bcrypt.compare(phoneOTP.toString(), otpEntry.otp);

    if (!validOtp)
      return res.status(400).json({ message: "Invalid OTP" });

    // check duplicate email/phone
    const existing = await prisma.student.findFirst({
      where: {
        OR: [{ mail_ID: email }, { phoneNo }],
      },
    });

    if (existing)
      return res.status(400).json({
        message: "User already exists",
      });

    /* AUTO-GENERATED student_ID */
    const allStudents = await prisma.student.findMany({
      select: { student_ID: true },
    });

    const used = new Set();
    allStudents.forEach((s) => {
      const match = s.student_ID?.match(/(\d{4})$/);
      if (match) used.add(parseInt(match[1]));
    });

    let nextNumber = 1;
    while (used.has(nextNumber)) nextNumber++;

    const student_ID = `RICR-RS-${String(nextNumber).padStart(4, "0")}`;

    /* Create Student */
    const newStudent = await prisma.student.create({
      data: {
        student_ID,
        fullName,
        phoneNo,
        mail_ID: email,
        college,
        branch,
        year,
        dob: new Date(dob),
      },
    });

    await prisma.otp.deleteMany({ where: { otpfor: phoneNo, type: "phone" } });

    const creds = {
      name: newStudent.fullName,
      student_ID: newStudent.student_ID,
      dob: formatDateDDMMYYYY(newStudent.dob),
    };

    await sendCredentialsEmail(email, creds);

    res.status(201).json({
      message: "Registration successful",
      student: newStudent,
    });
  } catch (err) {
    next(err);
  }
};

/* ---------------- SEND CREDENTIALS ---------------- */
export const SendCredentials = async (req, res, next) => {
  try {
    const { mail_ID, student_ID } = req.body;

    const student = await prisma.student.findFirst({
      where: { mail_ID, student_ID },
    });

    if (!student)
      return res.status(404).json({ message: "Student not found" });

    const creds = {
      name: student.fullName,
      student_ID,
      dob: formatDateDDMMYYYY(student.dob),
    };

    await sendCredentialsEmail(mail_ID, creds);

    res.json({ message: "Credentials sent to email" });
  } catch (err) {
    next(err);
  }
};

/* ---------------- LOGIN ---------------- */
export const Login = async (req, res, next) => {
  try {
    const { student_ID, dob } = req.body;

    const student = await prisma.student.findFirst({ where: { student_ID } });

    if (!student)
      return res.status(401).json({ message: "Invalid credentials" });

    const inputDate = new Date(dob).setHours(0, 0, 0, 0);
    const storedDate = new Date(student.dob).setHours(0, 0, 0, 0);

    if (inputDate !== storedDate)
      return res.status(401).json({ message: "Invalid credentials" });

    const token = generateAuthToken(student, null, res);

    res.json({ message: "Login successful", student, token });
  } catch (err) {
    next(err);
  }
};

/* ---------------- PROFILE ---------------- */
export const getStudentProfile = async (req, res) => {
  try {
    const userId = req.user?.id; // Ensure `req.user` is populated by middleware
    if (!userId) {
      return res.status(400).json({ message: "User ID is missing" });
    }

    const student = await prisma.student.findUnique({
      where: { id: userId },
    });

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    res.status(200).json(student);
  } catch (error) {
    console.error("Error in getStudentProfile:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};





export const BookDemoSlot = async (req, res, next) => {
  try {
    // guard: ensure prisma exists
    if (!prisma || typeof prisma.demo?.findFirst !== "function") {
      console.error("Prisma client is not initialized or demo model missing on prisma object.", { prisma });
      return res.status(500).json({
        success: false,
        message: "Server misconfiguration: database client not available.",
      });
    }

    const { studentName, email, phone, collegeName, year, demoSlot, type } = req.body;

    // Required fields check
    if (!studentName || !email || !phone || !collegeName || !year || !demoSlot || !type) {
      return res.status(400).json({
        success: false,
        message: "All fields are required for booking demo slot",
      });
    }

    // Check if this student already booked a demo slot — using phone/email
    const existingBooking = await prisma.demo.findFirst({
      where: {
        OR: [{ email }, { phone }],
      },
    });

    if (existingBooking) {
      return res.status(409).json({
        success: false,
        alreadyBooked: true,
        message: "You have already booked a demo slot.",
        booking: existingBooking,
      });
    }

    // Create new booking
    const booking = await prisma.demo.create({
      data: {
        studentName,
        email,
        phone,
        collegeName,
        year,
        demoSlot,
        type,
      },
    });

    // Try sending confirmation email (fail-safe)
    try {
      await sendConfirmationEmail({
        to: email,
        subject: "Demo Slot Booking Confirmation",
        studentName,
        demoSlot,
        type,
        collegeName,
        year,
      });
    } catch (emailErr) {
      console.error("Confirmation email failed:", emailErr);
      // DO NOT return error — booking is successful
    }

    return res.status(201).json({
      success: true,
      message: "Demo slot booked successfully!",
      booking,
    });
  } catch (error) {
    console.error("BookDemoSlot error:", error);
    next(error);
  }
};

// Get All Demo Bookings (Admin)
export const GetAllDemoBookings = async (req, res, next) => {
  try {
    const demoList = await prisma.demo.findMany({
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json({
      success: true,
      count: demoList.length,
      demoList,
    });
  } catch (error) {
    next(error);
  }
};

// Get Demo Booking by Email or Phone (Student)
export const GetMyDemoBooking = async (req, res, next) => {
  try {
    const { email, phone } = req.query;

    const booking = await prisma.demo.findFirst({
      where: {
        OR: [{ email }, { phone }],
      },
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "No demo booking found.",
      });
    }

    return res.status(200).json({
      success: true,
      booking,
    });
  } catch (error) {
    next(error);
  }
};


export const GetDemoSlots = async (req, res, next) => {
  try {
    const demoSlots = await prisma.demo.findMany();
    res.status(200).json(demoSlots);
  } catch (error) {
    next(error);
  }
};










const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"];

// Helpers to serialize/parse responses (Prisma schema uses String for responses)
const stringifyResponses = (arr) => {
  try {
    return JSON.stringify(Array.isArray(arr) ? arr : []);
  } catch (e) {
    return "[]";
  }
};

const parseResponses = (rowOrString) => {
  if (!rowOrString) return [];
  const raw = typeof rowOrString === "string" ? rowOrString : rowOrString.responses;
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
};

const uploadBufferToCloudinary = (buffer, folder = "support_images") =>
  new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder, resource_type: "image" },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    streamifier.createReadStream(buffer).pipe(uploadStream);
  });

// Accept many shapes for user id both in auth middleware and controllers
const getUserIdFromReqUser = (reqUser) => {
  if (!reqUser) return null;
  // Common possibilities
  return (
    reqUser.id ??
    reqUser._id ??
    reqUser.user_id ??
    reqUser.userId ??
    reqUser.sub ??
    reqUser._userId ??
    null
  );
};

// Submit support query
export const SubmitSupportQuery = async (req, res, next) => {
  try {
    if (!prisma || typeof prisma.supportQuery?.create !== "function") {
      console.error("Prisma supportQuery model missing. Models:", Object.keys(prisma || {}));
      return res.status(500).json({ message: "Server misconfiguration: SupportQuery model missing." });
    }

    const { subject, description, email } = req.body;
    if (!subject || !description) {
      return res.status(400).json({ message: "Subject and description are required" });
    }

    // Resolve studentId preference: req.user (if present) -> body.studentId -> body.email lookup
    let studentId = null;
    try {
      const uid = getUserIdFromReqUser(req.user);
      if (uid) {
        studentId = String(uid);
      } else if (req.body.studentId) {
        studentId = String(req.body.studentId);
      } else if (email) {
        const student = await prisma.student.findFirst({ where: { mail_ID: email.toLowerCase().trim() }, select: { id: true } });
        if (!student) return res.status(400).json({ message: "Student not found for provided email" });
        studentId = student.id;
      } else {
        return res.status(400).json({ message: "Unable to resolve student. Authenticate or provide email/studentId" });
      }
    } catch (err) {
      console.error("Resolve student error:", err);
      return res.status(400).json({ message: err.message });
    }

    // Image upload handling if file present (multer memoryStorage recommended)
    let imageUrl = null;
    let imagePublicId = null;

    if (req.file) {
      if (!ALLOWED_IMAGE_TYPES.includes(req.file.mimetype)) {
        return res.status(400).json({ message: "Invalid file type. Only images are allowed." });
      }
      try {
        if (req.file.buffer) {
          const result = await uploadBufferToCloudinary(req.file.buffer, "support_images");
          imageUrl = result.secure_url;
          imagePublicId = result.public_id;
        } else if (req.file.path) {
          const result = await cloudinary.uploader.upload(req.file.path, { folder: "support_images", resource_type: "image" });
          imageUrl = result.secure_url;
          imagePublicId = result.public_id;
        }
      } catch (uploadErr) {
        console.error("Cloudinary upload error:", uploadErr);
        return res.status(500).json({ message: "Image upload failed", error: uploadErr.message });
      }
    }

    const created = await prisma.supportQuery.create({
      data: {
        studentId,
        subject,
        description,
        imageUrl,
        imagePublicId,
        responses: stringifyResponses([]),
      },
      include: {
        student: { select: { id: true, fullName: true, mail_ID: true, phoneNo: true } },
      },
    });

    // Convert responses string -> array for client
    const result = { ...created, responses: parseResponses(created) };

    return res.status(201).json({ message: "Support query submitted successfully", query: result });
  } catch (error) {
    console.error("SubmitSupportQuery error:", error);
    return res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};

// Get support queries for logged-in student
export const GetStudentSupportQueries = async (req, res, next) => {
  try {
    const uid = getUserIdFromReqUser(req.user);

    // If req.user exists but we still got null uid, log it and return 401
    if (!uid) {
      console.warn("Unauthorized access: req.user is", req.user);
      return res.status(401).json({ message: "Authentication required" });
    }

    // fetch queries
    const rows = await prisma.supportQuery.findMany({
      where: { studentId: String(uid) },
      orderBy: { createdAt: "desc" },
      include: { student: { select: { id: true, fullName: true, mail_ID: true, phoneNo: true } } },
    });

    const queries = rows.map((r) => ({ ...r, responses: parseResponses(r) }));
    // return array directly (frontend expects array)
    return res.status(200).json(queries);
  } catch (error) {
    console.error("GetStudentSupportQueries error:", error);
    return res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};

// Get all support queries (admin)
export const GetAllSupportQueries = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.status) {
      const allowed = ["open", "in_progress", "resolved"];
      if (!allowed.includes(req.query.status)) return res.status(400).json({ message: "Invalid status filter" });
      filter.status = req.query.status;
    }

    const rows = await prisma.supportQuery.findMany({
      where: filter,
      orderBy: { createdAt: "desc" },
      include: { student: { select: { id: true, fullName: true, mail_ID: true, phoneNo: true } } },
    });

    const queries = rows.map((r) => ({ ...r, responses: parseResponses(r) }));
    return res.status(200).json(queries);
  } catch (error) {
    console.error("GetAllSupportQueries error:", error);
    return res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};

// Update status (admin)
export const UpdateSupportQueryStatus = async (req, res, next) => {
  try {
    const { queryId } = req.params;
    const { status } = req.body;
    const allowed = ["open", "in_progress", "resolved"];
    if (!allowed.includes(status)) return res.status(400).json({ message: "Invalid status value" });

    const updated = await prisma.supportQuery.update({
      where: { id: queryId },
      data: { status },
      include: { student: { select: { id: true, fullName: true, mail_ID: true, phoneNo: true } } },
    });

    return res.status(200).json({ message: "Support query status updated", query: { ...updated, responses: parseResponses(updated) } });
  } catch (error) {
    console.error("UpdateSupportQueryStatus error:", error);
    if (error.code === "P2025") return res.status(404).json({ message: "Support query not found" });
    return res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};

// Add response (admin/support agent)
export const AddSupportQueryResponse = async (req, res, next) => {
  try {
    const { queryId } = req.params;
    const { message, responder } = req.body;
    if (!message || !message.trim()) return res.status(400).json({ message: "Response message is required" });

    const responderName = (req.user && (req.user.name || req.user.fullName)) || responder;
    if (!responderName) return res.status(400).json({ message: "Responder name required" });

    const existing = await prisma.supportQuery.findUnique({ where: { id: queryId }, select: { responses: true } });
    if (!existing) return res.status(404).json({ message: "Support query not found" });

    const current = parseResponses(existing);
    const newResp = { responder: responderName, message, date: new Date().toISOString() };
    const updated = await prisma.supportQuery.update({
      where: { id: queryId },
      data: { responses: stringifyResponses([...current, newResp]), status: "in_progress" },
      include: { student: { select: { id: true, fullName: true, mail_ID: true, phoneNo: true } } },
    });

    return res.status(200).json({ message: "Response added to support query", query: { ...updated, responses: parseResponses(updated) } });
  } catch (error) {
    console.error("AddSupportQueryResponse error:", error);
    return res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};






/**
 * Helper: populate a referred record (use Prisma include)
 */
async function populateReferredRecordById(id) {
  if (!id) return null;
  return prisma.referred.findUnique({
    where: { id: String(id) },
    include: {
      // include related entities if they exist on your schema
      student: true,         // the student who created the referral (referrer student)
      caller: true,          // the admin/caller who created the referral
      referredStudent: true, // the student who registered (if any)
    },
  });
}

/**
 * POST /api/referrals/send-otp
 * body: { phoneNo, ref? }
 */
export const sendReferralOTP = async (req, res, next) => {
  try {
    const { phoneNo, ref } = req.body;
    if (!phoneNo) return res.status(400).json({ message: "phoneNo is required" });

    // Optional: check existence of referral (best-effort)
    if (ref) {
      try {
        const found = await prisma.referred.findFirst({
          where: {
            OR: [
              { refCode: ref },
              { studentId: ref },
              { callerId: ref },
            ],
          },
        });
        if (!found) console.warn("[sendReferralOTP] no referred record found for ref:", ref);
      } catch (e) {
        console.warn("[sendReferralOTP] lookup failed:", e?.message || e);
      }
    }

    // Remove previous OTPs for this phone
    await prisma.otp.deleteMany({ where: { otpfor: String(phoneNo), type: "phone" } });

    const phoneOTP = Math.floor(100000 + Math.random() * 900000).toString();

    try {
      await sendOTPPhone(String(phoneNo), phoneOTP);
    } catch (smsErr) {
      console.error("[sendReferralOTP] sendOTPPhone error:", smsErr);
      return res.status(502).json({ message: "Failed to send OTP. Try again later." });
    }

    const hashed = await bcrypt.hash(phoneOTP, 10);
    await prisma.otp.create({
      data: {
        otpfor: String(phoneNo),
        otp: hashed,
        type: "phone",
        createdAt: new Date(),
      },
    });

    return res.status(200).json({ message: "OTP sent successfully" });
  } catch (err) {
    console.error("[sendReferralOTP] ERROR:", err);
    next(err);
  }
};

/**
 * POST /api/referrals/create  (auth required)
 * If req.user is admin/caller => create referral with callerId
 * Else create with studentId
 */
export const createReferral = async (req, res, next) => {
  try {
    const referrer = req.user;
    if (!referrer) return res.status(401).json({ message: "Unauthorized: login required to create referral" });

    // Determine role and whether referrer is admin/caller
    const role = String(referrer.role || "").toLowerCase();
    const isAdminOrCaller = ["admin", "caller", "manager"].includes(role) || referrer.isAdmin === true;

    const studentId = isAdminOrCaller ? null : String(referrer.id ?? referrer._id ?? referrer.userId ?? "");
    const callerId = isAdminOrCaller ? String(referrer.id ?? referrer._id ?? "") : null;

    // check if a referred record already exists for this referrer
    let existing = null;
    if (studentId) {
      existing = await prisma.referred.findFirst({ where: { studentId } });
    } else if (callerId) {
      existing = await prisma.referred.findFirst({ where: { callerId } });
    }

    if (existing) {
      const populated = await populateReferredRecordById(existing.id);
      const frontendBase = (process.env.FRONTEND_URL && process.env.FRONTEND_URL.trim()) || "https://rsat.ricr.in";
      const referralLink = callerId
        ? `${frontendBase.replace(/\/+$/, "")}/callerDashboard/RefferedRegisterationPage?admin_ID=${encodeURIComponent(callerId)}`
        : `${frontendBase.replace(/\/+$/, "")}/candidateDashboard/RefferedRegisterationPage?userId=${encodeURIComponent(studentId)}`;
      return res.status(200).json({ message: "Referral exists", ref: populated || existing, referralLink });
    }

    const { referredName = "", referredEmail = "", referredPhone = "", collegeName = "", year = "" } = req.body || {};

    // Build create payload using Prisma field names
    const payload = {
      studentId: studentId || null,
      callerId: callerId || null,
      referrerStudentID: !isAdminOrCaller ? (referrer.student_ID ?? referrer.studentId ?? referrer.student_id ?? null) : null,
      referredName,
      referredEmail,
      referredPhone,
      collegeName,
      year,
      refCode: (studentId || callerId) ? String(studentId || callerId) : null,
      referredDate: new Date(),
    };

    // Create
    const newRef = await prisma.referred.create({ data: payload });

    const populated = await populateReferredRecordById(newRef.id);

    const frontendBase = (process.env.FRONTEND_URL && process.env.FRONTEND_URL.trim()) || "https://rsat.ricr.in";
    const referralLink = callerId
      ? `${frontendBase.replace(/\/+$/, "")}/callerDashboard/RefferedRegisterationPage?admin_ID=${encodeURIComponent(callerId)}`
      : `${frontendBase.replace(/\/+$/, "")}/candidateDashboard/RefferedRegisterationPage?userId=${encodeURIComponent(studentId)}`;

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
 *  - studentId
 *  - callerId
 *  - fallback: try Student.findUnique / Admin.findUnique
 */
export const getReferralInfo = async (req, res, next) => {
  try {
    const { code } = req.params;
    if (!code) return res.status(400).json({ message: "Referral code is required" });

    // 1) by refCode
    let refer = await prisma.referred.findFirst({
      where: { refCode: code },
      include: { student: true, caller: true, referredStudent: true },
    });
    if (refer) {
      return res.status(200).json({
        referrer: {
          id: refer.callerId ?? refer.studentId ?? null,
          name: refer.caller ? refer.caller.username ?? null : refer.student ? refer.student.fullName ?? null : refer.referrerStudentID ?? null,
          student_ID: refer.referrerStudentID ?? refer.student?.student_ID ?? null,
          userId: refer.studentId ?? refer.callerId ?? null,
          type: refer.callerId ? "caller" : "student",
        },
        referredName: refer.referredName || null,
        referredEmail: refer.referredEmail || null,
        referredPhone: refer.referredPhone || null,
        collegeName: refer.collegeName || null,
        year: refer.year || null,
      });
    }

    // 2) by studentId
    refer = await prisma.referred.findFirst({
      where: { studentId: code },
      include: { student: true },
    });
    if (refer) {
      return res.status(200).json({
        referrer: {
          id: refer.student?.id ?? null,
          name: refer.student?.fullName ?? refer.referrerStudentID ?? null,
          student_ID: refer.referrerStudentID ?? refer.student?.student_ID ?? null,
          userId: refer.studentId ?? null,
          type: "student",
        },
        referredName: refer.referredName || null,
        referredEmail: refer.referredEmail || null,
        referredPhone: refer.referredPhone || null,
        collegeName: refer.collegeName || null,
        year: refer.year || null,
      });
    }

    // 3) by callerId
    refer = await prisma.referred.findFirst({
      where: { callerId: code },
      include: { caller: true },
    });
    if (refer) {
      return res.status(200).json({
        referrer: {
          id: refer.caller?.id ?? null,
          name: refer.caller?.username ?? null,
          role: refer.caller?.role ?? null,
          phone: refer.caller?.phone ?? null,
          userId: refer.callerId ?? null,
          type: "caller",
        },
        referredName: refer.referredName || null,
        referredEmail: refer.referredEmail || null,
        referredPhone: refer.referredPhone || null,
        collegeName: refer.collegeName || null,
        year: refer.year || null,
      });
    }

    // 4) treat code as an ObjectId-like id -> fallback lookup in Student and Admin
    // Prisma uses UUIDs so we just try findUnique by id
    const student = await prisma.student.findUnique({
      where: { id: code },
      select: { id: true, student_ID: true, fullName: true, mail_ID: true, phoneNo: true },
    });
    if (student) {
      return res.status(200).json({
        referrer: {
          id: student.id,
          name: student.fullName || null,
          student_ID: student.student_ID || null,
          userId: student.id,
          type: "student",
        },
        referredName: null,
        referredEmail: null,
        referredPhone: null,
        collegeName: null,
        year: null,
      });
    }

    const admin = await prisma.admin.findUnique({
      where: { id: code },
      select: { id: true, username: true, role: true, phone: true },
    });
    if (admin) {
      return res.status(200).json({
        referrer: {
          id: admin.id,
          name: admin.username || null,
          role: admin.role || null,
          phone: admin.phone || null,
          userId: admin.id,
          type: "caller",
        },
        referredName: null,
        referredEmail: null,
        referredPhone: null,
        collegeName: null,
        year: null,
      });
    }

    return res.status(404).json({ message: "Referral not found" });
  } catch (err) {
    console.error("[getReferralInfo] ERROR:", err && err.stack ? err.stack : err);
    next(err);
  }
};

/**
 * POST /api/referrals/register?userId=REFUSERID
 * userId may be a Student.id OR Admin.id (caller) OR refCode
 */
// server/src/controller/authController.js  (or wherever registerWithReferral lives)
// (ESM style — adjust imports above this function as needed)

export const registerWithReferral = async (req, res, next) => {
  try {
    // DEBUG: show raw incoming data for quick diagnosis
    console.log("[registerWithReferral] req.query.userId:", req.query?.userId);
    console.log("[registerWithReferral] req.body raw:", req.body);
    console.log("[registerWithReferral] req.headers content-type:", req.headers["content-type"]);

    const { userId } = req.query;
    if (!userId) return res.status(400).json({ message: "Referral userId missing" });

    // Normalize/unwrap body keys (make sure names match what frontend sends)
    const {
      fullName,
      phoneNo,
      mail_ID,
      college,
      branch,
      year,
      dob,
      phoneOTP,
    } = req.body || {};

    // Improved validation: report exactly which fields missing
    const required = ["fullName", "phoneNo", "mail_ID", "college", "branch", "year", "dob", "phoneOTP"];
    const missing = required.filter((k) => {
      const v = req.body?.[k];
      return v === undefined || v === null || (typeof v === "string" && v.trim() === "");
    });
    if (missing.length) {
      console.warn("[registerWithReferral] missing fields:", missing, "received body keys:", Object.keys(req.body || {}));
      return res.status(400).json({ message: "Missing required fields", missing });
    }

    // Find referred record if exists
    let refer = await prisma.referred.findFirst({
      where: {
        OR: [
          { studentId: userId },
          { callerId: userId },
          { refCode: userId },
        ],
      },
    });

    // Validate OTP exists (phone OTP)
    const phoneOTPEntry = await prisma.otp.findFirst({
      where: { otpfor: String(phoneNo), type: "phone" },
    });
    if (!phoneOTPEntry) {
      console.warn("[registerWithReferral] phone OTP entry not found for:", phoneNo);
      return res.status(400).json({ message: "Phone OTP not found or expired" });
    }

    // Ensure bcrypt is available in this file scope
    const isPhoneOTPValid = await bcrypt.compare(String(phoneOTP).trim(), phoneOTPEntry.otp);
    if (!isPhoneOTPValid) {
      console.warn("[registerWithReferral] invalid phone OTP for:", phoneNo);
      return res.status(400).json({ message: "Invalid Phone OTP" });
    }

    // Email uniqueness check
    const existEmail = await prisma.student.findFirst({ where: { mail_ID } });
    if (existEmail) {
      return res.status(400).json({ message: "Email already registered" });
    }

    // Auto-generate student_ID (RCR-RSR-0001 style)
    const allStudents = await prisma.student.findMany({ select: { student_ID: true } });
    const usedNumbers = new Set();
    allStudents.forEach((s) => {
      const match = s.student_ID && s.student_ID.match(/(\d{4})$/);
      if (match) usedNumbers.add(parseInt(match[1], 10));
    });
    let nextNumber = 1;
    while (usedNumbers.has(nextNumber)) nextNumber++;
    const student_ID = `RCR-RSR-${nextNumber.toString().padStart(4, "0")}`;

    // Create new Student
    const newStudent = await prisma.student.create({
      data: {
        student_ID,
        fullName,
        phoneNo: String(phoneNo),
        mail_ID,
        college,
        branch,
        year,
        dob: new Date(dob),
      },
    });

    // remove OTP entries for phone (cleanup)
    await prisma.otp.deleteMany({ where: { otpfor: String(phoneNo), type: "phone" } });

    // If refer not exists, try to find referrer student/admin based on userId
    let referrerStudent = null;
    let referrerAdmin = null;
    if (!refer) {
      const maybeStudent = await prisma.student.findUnique({ where: { id: userId } }).catch(() => null);
      if (maybeStudent) referrerStudent = maybeStudent;
      else {
        const maybeAdmin = await prisma.admin.findUnique({ where: { id: userId } }).catch(() => null);
        if (maybeAdmin) referrerAdmin = maybeAdmin;
      }
    } else {
      if (refer.studentId) referrerStudent = await prisma.student.findUnique({ where: { id: refer.studentId } }).catch(() => null);
      if (refer.callerId) referrerAdmin = await prisma.admin.findUnique({ where: { id: refer.callerId } }).catch(() => null);
    }

    // Prepare update / create for referred record
    const updateFields = {
      referredStudentId: newStudent.id,
      referredName: fullName,
      referredEmail: mail_ID,
      referredPhone: String(phoneNo),
      collegeName: college,
      year,
      referredDate: new Date(),
      updatedAt: new Date(),
    };

    // Try to find existing referral record again by same query
    const existingReferral = await prisma.referred.findFirst({
      where: {
        OR: [{ studentId: userId }, { callerId: userId }, { refCode: userId }],
      },
    });

    let referralRecord;
    if (existingReferral) {
      referralRecord = await prisma.referred.update({
        where: { id: existingReferral.id },
        data: updateFields,
      });
    } else {
      // build create data
      const createData = {
        studentId: referrerStudent ? referrerStudent.id : null,
        callerId: referrerAdmin ? referrerAdmin.id : null,
        referrerStudentID: referrerStudent ? referrerStudent.student_ID : null,
        refCode: refer?.refCode ?? (referrerStudent ? String(referrerStudent.id) : (referrerAdmin ? String(referrerAdmin.id) : null)),
        referredStudentId: newStudent.id,
        referredName: fullName,
        referredEmail: mail_ID,
        referredPhone: String(phoneNo),
        collegeName: college,
        year,
        referredDate: new Date(),
      };
      referralRecord = await prisma.referred.create({ data: createData });
    }

    // If you have a helper to populate referral with relations, call it; otherwise return created referral simple object
    let populatedReferral = referralRecord;
    try {
      if (typeof populateReferredRecordById === "function") {
        populatedReferral = await populateReferredRecordById(referralRecord.id);
      }
    } catch (err) {
      console.warn("[registerWithReferral] populateReferredRecordById failed:", err?.message || err);
    }

    // Send confirmation & credentials (best effort)
    const recipientEmail = (mail_ID || newStudent.mail_ID || "").toString().trim();
    if (recipientEmail && typeof sendReferralConfirmationEmail === "function") {
      try {
        await sendReferralConfirmationEmail(recipientEmail, fullName, {
          referrerStudentID: populatedReferral?.referrerStudentID ?? referrerStudent?.student_ID ?? (referrerAdmin ? referrerAdmin.username : userId) ?? "-",
          rsatId: student_ID,
          dob: newStudent?.dob ?? dob,
          testDate: process.env.RSAT_TEST_DATE || "19th Jan 2026",
          venue: process.env.RSAT_VENUE || "RICR Campus - Minal Mall, 4th Floor, Minal Residency, JK Road, Bhopal (462023)",
        });
      } catch (mailErr) {
        console.error("[registerWithReferral] sendReferralConfirmationEmail ERROR:", mailErr?.message || mailErr);
      }
    }
    if (mail_ID && typeof sendCredentialsEmail === "function") {
      try {
        await sendCredentialsEmail(mail_ID, fullName, student_ID);
      } catch (emailErr) {
        console.error("[registerWithReferral] sendCredentialsEmail ERROR:", emailErr);
      }
    }

    // Generate token (assumes this sets cookie on res inside)
    let token = null;
    try {
      if (typeof generateAuthToken === "function") {
        token = generateAuthToken(newStudent, null, res);
      }
    } catch (tokErr) {
      console.warn("[registerWithReferral] generateAuthToken ERROR:", tokErr?.message || tokErr);
    }

    return res.status(201).json({
      message: "Registration successful, referral recorded, and confirmation email sent (if available).",
      student: newStudent,
      referral: populatedReferral,
      token,
    });
  } catch (err) {
    console.error("[registerWithReferral] ERROR:", err && err.stack ? err.stack : err);
    next(err);
  }
};
