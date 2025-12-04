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











// Allowed image types
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"];

// ======= HELPERS =======

// Convert JS array -> JSON string for DB storage
const stringifyResponses = (arr) => {
  try {
    return JSON.stringify(Array.isArray(arr) ? arr : []);
  } catch (e) {
    return JSON.stringify([]);
  }
};

// Parse DB field (string) -> JS array
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

// Resolve student id: prefer req.user, then body.studentId, then body.email lookup
const resolveStudentId = async (body = {}, user = null) => {
  const uid = (user && (user.id || user._id)) || null;
  if (uid) return uid.toString();

  if (body.studentId && typeof body.studentId === "string" && body.studentId.trim() !== "") {
    return body.studentId;
  }

  if (body.email && typeof body.email === "string") {
    const email = body.email.toLowerCase().trim();
    const student = await prisma.student.findFirst({ where: { mail_ID: email }, select: { id: true } });
    if (!student) throw new Error("Student not found for provided email");
    return student.id;
  }

  throw new Error("Unable to resolve student. Authenticate or provide email/studentId");
};

// Upload buffer to Cloudinary via stream (for multer memoryStorage)
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

// ======= SubmitSupportQuery (fixed) =======
export const SubmitSupportQuery = async (req, res, next) => {
  try {
    // Defensive check: ensure Prisma model exists
    if (!prisma || typeof prisma.supportQuery?.create !== "function") {
      console.error("Prisma supportQuery model missing. Models:", prisma?.$parent ? Object.keys(prisma.$parent) : Object.keys(prisma || {}));
      return res.status(500).json({
        success: false,
        message: "Server misconfiguration: SupportQuery model not available on Prisma client. Run `npx prisma generate` and `npx prisma db push`.",
      });
    }

    const { subject, description, email } = req.body;
    if (!subject || !description) {
      return res.status(400).json({ success: false, message: "Subject and description are required" });
    }

    // Resolve student id
    let studentId;
    try {
      studentId = await resolveStudentId({ email, studentId: req.body.studentId }, req.user);
    } catch (err) {
      return res.status(400).json({ success: false, message: err.message });
    }

    // Image handling (optional)
    let imageUrl = null;
    let imagePublicId = null;

    if (req.file) {
      // Validate mime type
      if (!ALLOWED_IMAGE_TYPES.includes(req.file.mimetype)) {
        return res.status(400).json({
          success: false,
          message: "Invalid file type. Only images (jpeg, png, gif, webp, svg) are allowed.",
        });
      }

      try {
        if (req.file.buffer) {
          const result = await uploadBufferToCloudinary(req.file.buffer, "support_images");
          imageUrl = result.secure_url;
          imagePublicId = result.public_id;
        } else if (req.file.path) {
          const result = await cloudinary.uploader.upload(req.file.path, {
            folder: "support_images",
            resource_type: "image",
          });
          imageUrl = result.secure_url;
          imagePublicId = result.public_id;
        }
      } catch (uploadError) {
        console.error("Cloudinary upload error:", uploadError);
        return res.status(500).json({ success: false, message: "Image upload failed", error: uploadError.message });
      }
    }

    // Create support query - NOTE: responses must be a string per schema
    const created = await prisma.supportQuery.create({
      data: {
        studentId,
        subject,
        description,
        imageUrl,
        imagePublicId,
        responses: stringifyResponses([]), // <--- pass string
      },
      include: {
        student: { select: { id: true, fullName: true, mail_ID: true, phoneNo: true } },
      },
    });

    // Convert responses string -> array before returning to client
    const resultToSend = { ...created, responses: parseResponses(created) };

    return res.status(201).json({ success: true, message: "Support query submitted successfully", query: resultToSend });
  } catch (error) {
    console.error("SubmitSupportQuery error:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
  }
};

/**
 * GetAllSupportQueries (admin)
 * GET /support/all-queries?status=open&page=1&limit=20
 */
// GetAllSupportQueries (parse responses)
export const GetAllSupportQueries = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 50 } = req.query;
    const where = {};
    if (status) {
      const allowed = ["open", "in_progress", "resolved"];
      if (!allowed.includes(status)) return res.status(400).json({ success: false, message: "Invalid status filter" });
      where.status = status;
    }

    const take = Math.min(Number(limit) || 50, 200);
    const skip = (Math.max(Number(page) || 1, 1) - 1) * take;

    const [total, rows] = await Promise.all([
      prisma.supportQuery.count({ where }),
      prisma.supportQuery.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take,
        include: { student: { select: { id: true, fullName: true, mail_ID: true, phoneNo: true } } },
      }),
    ]);

    const queries = rows.map((r) => ({ ...r, responses: parseResponses(r) }));
    return res.status(200).json({ success: true, total, page: Number(page) || 1, limit: take, queries });
  } catch (error) {
    console.error("GetAllSupportQueries error:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
  }
};
;

/**
 * GetStudentSupportQueries
 * GET /support/student-queries
 */
// GetStudentSupportQueries (parse responses before returning)
export const GetStudentSupportQueries = async (req, res, next) => {
  try {
    const userId = (req.user && (req.user.id || req.user._id)) || null;
    if (!userId) return res.status(401).json({ success: false, message: "Authentication required" });

    const rows = await prisma.supportQuery.findMany({
      where: { studentId: userId.toString() },
      orderBy: { createdAt: "desc" },
      include: { student: { select: { id: true, fullName: true, mail_ID: true, phoneNo: true } } },
    });

    const queries = rows.map((r) => ({ ...r, responses: parseResponses(r) }));
    return res.status(200).json({ success: true, queries });
  } catch (error) {
    console.error("GetStudentSupportQueries error:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
  }
};

/**
 * UpdateSupportQueryStatus
 * PUT /support/update-status/:queryId
 * body: { status }
 */
export const UpdateSupportQueryStatus = async (req, res, next) => {
  try {
    const { queryId } = req.params;
    const { status } = req.body;

    const allowed = ["open", "in_progress", "resolved"];
    if (!allowed.includes(status)) return res.status(400).json({ message: "Invalid status value" });

    // updateMany used to return count for not-found handling
    const updated = await prisma.supportQuery.updateMany({
      where: { id: queryId },
      data: { status },
    });

    if (updated.count === 0) return res.status(404).json({ message: "Support query not found" });

    const query = await prisma.supportQuery.findUnique({
      where: { id: queryId },
      include: { student: { select: { id: true, fullName: true, mail_ID: true, phoneNo: true } } },
    });

    return res.status(200).json({ message: "Support query status updated", query });
  } catch (error) {
    console.error("UpdateSupportQueryStatus error:", error);
    next(error);
  }
};

/**
 * AddSupportQueryResponse
 * POST /support/:queryId/respond
 * body: { message, responder? }
 */
// AddSupportQueryResponse (fixed)
export const AddSupportQueryResponse = async (req, res, next) => {
  try {
    const { queryId } = req.params;
    const { message, responder } = req.body;

    if (!message || message.trim() === "") return res.status(400).json({ success: false, message: "Response message is required" });

    const responderName = (req.user && (req.user.name || req.user.fullName)) || responder;
    if (!responderName) return res.status(400).json({ success: false, message: "Responder name required (authenticate or send responder in body)" });

    // fetch existing responses (string)
    const existing = await prisma.supportQuery.findUnique({ where: { id: queryId }, select: { responses: true } });
    if (!existing) return res.status(404).json({ success: false, message: "Support query not found" });

    const current = parseResponses(existing); // parse string -> array
    const newResp = { responder: responderName, message, date: new Date().toISOString() };
    const updatedResponses = [...current, newResp];

    const updated = await prisma.supportQuery.update({
      where: { id: queryId },
      data: { responses: stringifyResponses(updatedResponses), status: "in_progress" },
      include: { student: { select: { id: true, fullName: true, mail_ID: true, phoneNo: true } } },
    });

    return res.status(200).json({ success: true, message: "Response added to support query", query: { ...updated, responses: parseResponses(updated) } });
  } catch (error) {
    console.error("AddSupportQueryResponse error:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
  }
};
