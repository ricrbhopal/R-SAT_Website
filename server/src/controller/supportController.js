// controllers/supportController.js
import mongoose from "mongoose";
import streamifier from "streamifier";
import SupportQuery from "../models/supportQueriesModel.js"; // आपका schema file
import Student from "../models/authModel.js"; // Student model (adjust path/name if different)
import cloudinary from "../utils/couldinary.js"; // Cloudinary config (as in your project)

/**
 * Helper: get studentId
 * Priority:
 *  1) req.user._id (if authenticated)
 *  2) If body.email provided -> find student by email
 *  3) If body.studentId provided -> use it (admin case)
 */
const resolveStudentId = async (reqBody, reqUser) => {
  if (reqUser && reqUser._id) return reqUser._id;

  // admin may pass studentId explicitly
  if (reqBody.studentId) {
    if (mongoose.Types.ObjectId.isValid(reqBody.studentId)) return reqBody.studentId;
    throw new Error("Invalid studentId");
  }

  // fallback: try to find by email (if provided)
  if (reqBody.email) {
    const student = await Student.findOne({ mail_ID: reqBody.email.toLowerCase().trim() });
    if (!student) throw new Error("Student not found for provided email");
    return student._id;
  }

  // nothing found
  throw new Error("Unable to resolve student. Authenticate or provide email/studentId");
};

/**
 * Helper: upload buffer to cloudinary using upload_stream
 */
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

/**
 * Submit a new support query (student)
 * POST /support/submit-query
 * body: { subject, description, email? , studentId? , name? }
 * Accepts ONE image file under field name 'image' (multer single)
 */
export const SubmitSupportQuery = async (req, res, next) => {
  try {
    // Defensive check: ensure prisma model exists
    if (!prisma || typeof prisma.supportQuery?.create !== "function") {
      console.error("Prisma supportQuery model missing. Available models:", Object.keys(prisma?.$parent || {}));
      return res.status(500).json({
        success: false,
        message:
          "Server misconfiguration: SupportQuery model not available on Prisma client. Run `npx prisma generate` and `npx prisma db push`.",
      });
    }

    const { subject, description, email } = req.body;

    if (!subject || !description) {
      return res.status(400).json({ success: false, message: "Subject and description are required" });
    }

    // Resolve studentId
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
      } catch (uploadErr) {
        console.error("Cloudinary upload error:", uploadErr);
        return res.status(500).json({ success: false, message: "Image upload failed", error: uploadErr.message });
      }
    }

    // Create support query
    const created = await prisma.supportQuery.create({
      data: {
        studentId,
        subject,
        description,
        imageUrl,
        imagePublicId,
        responses: [], // initialize JSON array
        // status will default to "open" per schema
      },
      include: {
        student: { select: { id: true, fullName: true, mail_ID: true, phoneNo: true } },
      },
    });

    return res.status(201).json({ success: true, message: "Support query submitted successfully", query: created });
  } catch (error) {
    console.error("SubmitSupportQuery error:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
  }
};


/**
 * Get all support queries (admin)
 * GET /support/all-queries
 * Optional query params: ?status=open
 */
export const GetAllSupportQueries = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.status) {
      const allowed = ["open", "in_progress", "resolved"];
      if (!allowed.includes(req.query.status)) {
        return res.status(400).json({ message: "Invalid status filter" });
      }
      filter.status = req.query.status;
    }

    // optionally support pagination later
    const queries = await SupportQuery.find(filter)
      .sort({ createdAt: -1 })
      .populate({ path: "studentId", select: "fullName mail_ID phoneNo" })
      .lean();

    return res.status(200).json(queries);
  } catch (error) {
    next(error);
  }
};

/**
 * Get support queries for the logged-in student
 * GET /support/student-queries
 */
export const GetStudentSupportQueries = async (req, res, next) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const studentId = req.user._id;

    const queries = await SupportQuery.find({ studentId })
      .sort({ createdAt: -1 })
      .populate({ path: "studentId", select: "fullName mail_ID phoneNo" })
      .lean();

    return res.status(200).json(queries);
  } catch (error) {
    next(error);
  }
};

/**
 * Update support query status (admin)
 * PUT /support/update-status/:queryId
 * body: { status: "open" | "in_progress" | "resolved" }
 */
export const UpdateSupportQueryStatus = async (req, res, next) => {
  try {
    const { queryId } = req.params;
    const { status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(queryId)) {
      return res.status(400).json({ message: "Invalid queryId" });
    }
    const allowed = ["open", "in_progress", "resolved"];
    if (!allowed.includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const query = await SupportQuery.findByIdAndUpdate(
      queryId,
      { status },
      { new: true }
    ).populate({ path: "studentId", select: "fullName mail_ID phoneNo" });

    if (!query) {
      return res.status(404).json({ message: "Support query not found" });
    }

    return res.status(200).json({ message: "Support query status updated", query });
  } catch (error) {
    next(error);
  }
};

/**
 * Add response to support query (admin or support agent)
 * POST /support/:queryId/respond
 * body: { message }
 * responder will be taken from req.user.name if exists, otherwise require responder in body
 */
export const AddSupportQueryResponse = async (req, res, next) => {
  try {
    const { queryId } = req.params;
    const { message, responder } = req.body;

    if (!mongoose.Types.ObjectId.isValid(queryId)) {
      return res.status(400).json({ message: "Invalid queryId" });
    }
    if (!message) {
      return res.status(400).json({ message: "Response message is required" });
    }

    const responderName = (req.user && (req.user.name || req.user.fullName)) || responder;
    if (!responderName) {
      return res.status(400).json({ message: "Responder name required (authenticate or send responder in body)" });
    }

    const query = await SupportQuery.findByIdAndUpdate(
      queryId,
      {
        $push: {
          responses: { responder: responderName, message, date: new Date() },
        },
        status: "in_progress",
      },
      { new: true }
    ).populate({ path: "studentId", select: "fullName mail_ID phoneNo" });

    if (!query) {
      return res.status(404).json({ message: "Support query not found" });
    }

    return res.status(200).json({ message: "Response added to support query", query });
  } catch (error) {
    next(error);
  }
};
