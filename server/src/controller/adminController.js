import AuthModel from "../models/authModel.js";
import Referred from "../models/refferedModel.js";
import DemoClass from "../models/demoModel.js";
import SupportQuery from "../models/supportQueriesModel.js";
import Result from "../models/resultModel.js";
import AdmitCard from "../models/admitCardmodel.js";
import Student from "../models/authModel.js";
import { sendConfirmationEmail } from "../utils/emailService.js";
import { verifyPresentToken } from "../utils/genAuthToken.js";
import { sendAdmitCardEmail } from "../utils/emailService.js";
import { sendOTPPhone } from "../utils/phoneService.js";
import bcrypt from "bcryptjs";
import AdminAuth from "../models/adminAuth.js";
import Otp from "../models/otpModel.js";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

// Utility: Remove sensitive fields from user object
function sanitizeUser(user) {
  if (!user) return user;
  const obj = user.toObject ? user.toObject() : { ...user };
  delete obj.password;
  return obj;
}

// Example: Get all users (admin only)
export const getAllUsers = async (req, res, next) => {
  try {
    const users = await AuthModel.find().select("-password"); // Exclude passwords
    res.status(200).json(users);
  } catch (error) {
    next(error);
  }
};

// admin edit user details can be added here in future
// admin delete user can be added here in future

export const putUserDetails = async (req, res, next) => {
  try {
    const userId = req.params.id;
    const updateData = req.body;
    const updatedUser = await AuthModel.findByIdAndUpdate(userId, updateData, {
      new: true,
    }).select("-password");
    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }
    res
      .status(200)
      .json({ message: "User updated successfully", user: updatedUser });
  } catch (error) {
    next(error);
  }
};

// Enhanced validation for ObjectId
export const getUserById = async (req, res, next) => {
  try {
    const userId = req.params.id;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid or missing User ID" });
    }

    const user = await AuthModel.findById(userId).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    const userId = req.params.id;
    const deletedUser = await AuthModel.findByIdAndDelete(userId);
    if (!deletedUser) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    next(error);
  }
};

// get All referred users

export const getRefferedUsers = async (req, res, next) => {
  try {
    const referredUsers = await Referred.find().populate(
      "referrerId",
      "student_ID fullName mail_ID phoneNo"
    );
    res.status(200).json(referredUsers);
  } catch (error) {
    next(error);
  }
};

// edit referred user details can be added here in future

export const putRefferedUserDetails = async (req, res, next) => {
  try {
    const referredId = req.params.id;
    const updateData = req.body;

    // Map incoming fields to schema fields
    const mappedData = {
      referredName: updateData.fullName,
      referredEmail: updateData.mail_ID,
      referredPhone: updateData.phoneNo,
      collegeName: updateData.collegeName,
      year: updateData.year,
      refCode: updateData.refCode,
    };

    const updatedReferred = await Referred.findByIdAndUpdate(
      referredId,
      mappedData,
      {
        new: true,
        runValidators: true, // Ensure validation is applied
      }
    ).populate("referrerId", "student_ID fullName mail_ID phoneNo");

    if (!updatedReferred) {
      return res.status(404).json({ message: "Referred user not found" });
    }

    res.status(200).json({
      message: "Referred user updated successfully",
      referred: updatedReferred,
    });
  } catch (error) {
    console.error("[putRefferedUserDetails] Error:", error);
    next(error);
  }
};

// delete referred user can be added here in future

export const deleteRefferedUser = async (req, res, next) => {
  try {
    const referredId = req.params.id;
    const deletedReferred = await Referred.findByIdAndDelete(referredId);
    if (!deletedReferred) {
      return res.status(404).json({ message: "Referred user not found" });
    }

    res.status(200).json({ message: "Referred user deleted successfully" });
  } catch (error) {
    next(error);
  }
};

// get by id referred user can be added here in fut
export const getRefferedUserById = async (req, res, next) => {
  try {
    const referredId = req.params.id;
    const referredUser = await Referred.findById(referredId).populate(
      "referrerId",
      "student_ID fullName mail_ID phoneNo"
    );
    if (!referredUser) {
      return res.status(404).json({ message: "Referred user not found" });
    }
    res.status(200).json(referredUser);
  } catch (error) {
    next(error);
  }
};

export const getAllDemoClasses = async (req, res, next) => {
  try {
    const demoClasses = await DemoClass.find({});
    res.status(200).json(demoClasses);
  } catch (error) {
    next(error);
  }
};

export const getDemoClassById = async (req, res, next) => {
  try {
    const demoClassId = req.params.id;
    const demoClass = await DemoClass.findById(demoClassId);
    if (!demoClass) {
      return res.status(404).json({ message: "Demo class not found" });
    }
    res.status(200).json(demoClass);
  } catch (error) {
    next(error);
  }
};

// DELETE Demo Class
export const deleteDemoClass = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: "ID is required" });
    }

    const deleted = await DemoClass.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ message: "Demo class not found" });
    }

    return res.status(200).json({ message: "Demo class deleted successfully" });
  } catch (error) {
    console.error("Error deleting demo class:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const putDemoClassDetails = async (req, res, next) => {
  try {
    const demoClassId = req.params.id;
    const updateData = req.body;
    const updatedDemoClass = await DemoClass.findByIdAndUpdate(
      demoClassId,
      updateData,
      {
        new: true,
      }
    );
    if (!updatedDemoClass) {
      return res.status(404).json({ message: "Demo class not found" });
    }

    // Send confirmation email to the user
    if (updatedDemoClass.email) {
      try {
        await sendConfirmationEmail({
          to: updatedDemoClass.email,
          studentName: updatedDemoClass.studentName,
          demoSlot: updatedDemoClass.demoSlot,
          type: updatedDemoClass.type,
          collegeName: updatedDemoClass.collegeName,
          year: updatedDemoClass.year,
        });
     
      } catch (emailError) {
        console.error("Failed to send confirmation email:", emailError);
      }
    }

    res.status(200).json({
      message: "Demo class updated successfully",
      demoClass: updatedDemoClass,
    });
  } catch (error) {
    next(error);
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

    // Fetch queries with populated student details
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

    return res
      .status(200)
      .json({ message: "Support query status updated", query });
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

    const responderName =
      (req.user && (req.user.name || req.user.fullName)) || responder;
    if (!responderName) {
      return res.status(400).json({
        message:
          "Responder name required (authenticate or send responder in body)",
      });
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

    return res
      .status(200)
      .json({ message: "Response added to support query", query });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete support query (admin)
 * DELETE /support/delete/:queryId
 */
export const DeleteSupportQuery = async (req, res, next) => {
  try {
    const { queryId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(queryId)) {
      return res.status(400).json({ message: "Invalid queryId" });
    }

    const deletedQuery = await SupportQuery.findByIdAndDelete(queryId);

    if (!deletedQuery) {
      return res.status(404).json({ message: "Support query not found" });
    }

    return res
      .status(200)
      .json({ message: "Support query deleted successfully" });
  } catch (error) {
    next(error);
  }
};

/** helper: generate short unique RSAT */
const genRSAT = () =>
  "RSAT-" + crypto.randomBytes(4).toString("hex").toUpperCase();

export const bulkCreateAdmitCards = async (req, res) => {
  try {
    const { venue, examDate, examTime, ReportingTime } = req.body;

    // Validate required fields
    if (!venue || !examDate || !examTime || !ReportingTime) {
      return res.status(400).json({ message: "All fields are required." });
    }

    // Fetch all students
    const students = await Student.find();
    if (!students || students.length === 0) {
      return res
        .status(400)
        .json({ message: "No students found to create admit cards." });
    }

    // Prepare admit cards for all students
    const admitCardsToInsert = students.map((student) => ({
      studentId: student._id,
      ApplicantName: student.fullName || student.name || "",
      contact: student.phoneNo || student.phone || student.email || "",
      college: student.college || "",
      branch: student.branch || "",
      year: student.year || "",
      RSAT: student.student_ID || genRSAT(),
      venue,
      examDate,
      examTime,
      ReportingTime,
    }));

    // Save admit cards in bulk
    const createdAdmitCards = await AdmitCard.insertMany(admitCardsToInsert);

    // Build a map of students by id for quick lookup
    const studentMap = new Map();
    students.forEach((s) => studentMap.set(String(s._id), s));

    // Send confirmation emails and update each admit card with email status
    const results = await Promise.all(
      createdAdmitCards.map(async (admitCard) => {
        const student =
          studentMap.get(String(admitCard.studentId)) ||
          (await Student.findById(admitCard.studentId));

        // resolve the email address field(s) — try common field names
        const emailCandidates = [
          student?.mail_ID,
          student?.mailId,
          student?.email,
          student?.mail,
          student?.contactEmail,
        ].filter(Boolean);

        // prefer first valid email
        const resolvedEmail = Array.isArray(emailCandidates[0])
          ? emailCandidates[0][0]
          : emailCandidates[0];

        if (!resolvedEmail) {
          // update DB: email missing
          admitCard.emailSent = false;
          admitCard.emailSentAt = null;
          admitCard.emailError =
            "Student email not found (mail_ID/email/mailId)";
          await admitCard.save();
          return {
            admitCardId: admitCard._id,
            success: false,
            error: admitCard.emailError,
          };
        }

        // Use sendAdmitCardEmail helper: it expects `student` with `.email` OR an email string in args.
        // We'll call sendAdmitCardEmail(studentObj, [admitCard], opts) — but ensure student.email exists.
        const studentForEmail = {
          ...(student.toObject ? student.toObject() : student),
          email: resolvedEmail,
        };

        try {
          // sendIndividually=false will send one email containing the admit card details (function you provided)
          const response = await sendAdmitCardEmail(
            studentForEmail,
            [admitCard],
            {
              attachFiles: [], // pass attachments if you have
              dashboardPath: "/student/dashboard",
              sendIndividually: false,
            }
          );

          if (response && response.success) {
            admitCard.emailSent = true;
            admitCard.emailSentAt = new Date();
            admitCard.emailError = null;
            await admitCard.save();
            return {
              admitCardId: admitCard._id,
              success: true,
              sentTo: response.sentTo || [resolvedEmail],
            };
          } else {
            const errMsg =
              response && response.error
                ? response.error
                : "Unknown send failure";
            admitCard.emailSent = false;
            admitCard.emailSentAt = null;
            admitCard.emailError = String(errMsg);
            await admitCard.save();
            return {
              admitCardId: admitCard._id,
              success: false,
              error: String(errMsg),
            };
          }
        } catch (err) {
          // sendAdmitCardEmail threw
          admitCard.emailSent = false;
          admitCard.emailSentAt = null;
          admitCard.emailError = err.message || String(err);
          await admitCard.save();
          console.error(
            `Email send error for admit ${admitCard._id} -> ${resolvedEmail}:`,
            err
          );
          return {
            admitCardId: admitCard._id,
            success: false,
            error: String(err.message || err),
          };
        }
      })
    );

    // return inserted count + email send summary
    return res.status(201).json({
      message: "Admit cards created successfully for all students.",
      createdCount: createdAdmitCards.length,
      emailResults: results,
    });
  } catch (error) {
    console.error("Error creating admit cards:", error);
    return res.status(500).json({
      message: "Failed to create admit cards.",
      error: String(error.message || error),
    });
  }
};




/**
 * Get All Admit Cards
 * GET /api/admitcards
 * supports ?page=&limit=&status=&search=
 */
export const getAllAdmitCards = async (req, res, next) => {
  try {
    const { page = 1, limit = 50, status, search } = req.query;
    const query = {};
    if (status) query.status = status;
    if (search) {
      const re = new RegExp(search, "i");
      query.$or = [
        { ApplicantName: re },
        { RSAT: re },
        { college: re },
        { contact: re },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [total, data] = await Promise.all([
      AdmitCard.countDocuments(query),
      AdmitCard.find(query)
        .sort({ examDate: 1, createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate("studentId", "fullName email"),
    ]);

    return res
      .status(200)
      .json({ total, page: Number(page), limit: Number(limit), data });
  } catch (err) {
    next(err);
  }
};

/**
 * Get Admit Card by ID
 * GET /api/admitcards/:id
 */
export const getAdmitCardById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const admitCard = await AdmitCard.findById(id).populate(
      "studentId",
      "fullName email"
    );
    if (!admitCard)
      return res.status(404).json({ message: "Admit card not found" });
    res.status(200).json(admitCard);
  } catch (err) {
    next(err);
  }
};

/**
 * Update Admit Card (partial)
 * PATCH /api/admitcards/:id
 */
export const updateAdmitCard = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updated = await AdmitCard.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!updated)
      return res.status(404).json({ message: "Admit card not found" });
    res
      .status(200)
      .json({ message: "Admit card updated successfully", admitCard: updated });
  } catch (err) {
    // duplicate key handling
    if (err.code === 11000) {
      return res
        .status(409)
        .json({ message: "Duplicate value error", details: err.keyValue });
    }
    next(err);
  }
};

/**
 * Delete Admit Card
 * DELETE /api/admitcards/:id
 */
export const deleteAdmitCard = async (req, res, next) => {
  try {
    const { id } = req.params;
    const removed = await AdmitCard.findByIdAndDelete(id);
    if (!removed)
      return res.status(404).json({ message: "Admit card not found" });
    res.status(200).json({ message: "Admit card deleted successfully" });
  } catch (err) {
    next(err);
  }
};

/**
 * Update Admit Card Status (issue)
 * POST /api/admitcards/:id/status
 * Body: { status: "issued" | "not_issued", issuedBy? }
 */
export const updateAdmitCardStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, issuedBy } = req.body;

    if (!status || !["issued", "not_issued"].includes(status)) {
      return res
        .status(400)
        .json({ message: "Invalid status. Use 'issued' or 'not_issued'." });
    }

    const updates = { status };
    if (status === "issued") {
      updates.issuedAt = new Date();
      if (issuedBy) updates.issuedBy = issuedBy;
    } else {
      updates.issuedAt = null;
      updates.issuedBy = null;
    }

    const admitCard = await AdmitCard.findByIdAndUpdate(id, updates, {
      new: true,
    }).populate("studentId", "fullName email");

    if (!admitCard)
      return res.status(404).json({ message: "Admit card not found" });

    // send email if issued and student email exists
    if (
      status === "issued" &&
      admitCard.studentId &&
      admitCard.studentId.email
    ) {
      try {
        const admits = [
          {
            _id: admitCard._id,
            admitToken: admitCard.admitToken,
            examDate: admitCard.examDate,
            venue: admitCard.venue,
            examTime: admitCard.examTime,
            ReportingTime: admitCard.ReportingTime,
          },
        ];

        await sendAdmitCardEmail(
          {
            name: admitCard.studentId.fullName,
            email: admitCard.studentId.email,
          },
          admits,
          { subject: "Your Admit Card is Issued" }
        );

        // update emailSent flags
        admitCard.emailSent = true;
        admitCard.emailSentAt = new Date();
        admitCard.emailError = null;
        await admitCard.save();
      } catch (emailErr) {
        console.error("Email send failed:", emailErr);
        admitCard.emailSent = false;
        admitCard.emailSentAt = null;
        admitCard.emailError = emailErr.message || String(emailErr);
        await admitCard.save();

        // return success about status but inform about email failure
        return res.status(200).json({
          message:
            "Admit card status updated to 'issued' but failed to send email",
          admitCard,
          emailError: admitCard.emailError,
        });
      }
    }

    return res
      .status(200)
      .json({ message: "Admit card status updated successfully", admitCard });
  } catch (err) {
    next(err);
  }
};

/**
 * Bulk update admit cards
 * PATCH /api/admitcards/bulk-update
 */
export const bulkUpdateAdmitCards = async (req, res) => {
  try {
    const { venue, examDate, examTime, ReportingTime } = req.body;

    // Validate required fields
    if (!venue || !examDate || !examTime || !ReportingTime) {
      return res.status(400).json({ message: "All fields are required." });
    }

    // Update all admit cards
    const updatedAdmitCards = await AdmitCard.updateMany(
      {},
      { venue, examDate, examTime, ReportingTime },
      { new: true, runValidators: true }
    );

    if (updatedAdmitCards.modifiedCount === 0) {
      return res.status(404).json({ message: "No admit cards were updated." });
    }

    return res.status(200).json({
      message: "Admit cards updated successfully.",
      updatedCount: updatedAdmitCards.modifiedCount,
    });
  } catch (error) {
    console.error("Error updating admit cards:", error);
    return res.status(500).json({
      message: "Failed to update admit cards.",
      error: String(error.message || error),
    });
  }
};

export const getPublicAdmitCard = async (req, res, next) => {
  try {
    const { idOrRsat } = req.params;

    // Try as ObjectId first, if not found try RSAT
    let admit = null;
    if (idOrRsat.match(/^[0-9a-fA-F]{24}$/)) {
      admit = await AdmitCard.findById(idOrRsat).populate(
        "studentId",
        "fullName email phoneNo"
      );
    }
    if (!admit) {
      admit = await AdmitCard.findOne({ RSAT: idOrRsat }).populate(
        "studentId",
        "fullName email phoneNo"
      );
    }

    if (!admit) {
      return res.status(404).json({ message: "Admit card not found" });
    }

    // Return minimal safe data for public view
    const payload = {
      _id: admit._id,
      RSAT: admit.RSAT,
      ApplicantName: admit.ApplicantName || admit.studentId?.fullName,
      contact:
        admit.contact || admit.studentId?.phoneNo || admit.studentId?.email,
      college: admit.college || admit.studentId?.college,
      branch: admit.branch || admit.studentId?.branch,
      year: admit.year || admit.studentId?.year,
      venue: admit.venue,
      examDate: admit.examDate,
      examTime: admit.examTime,
      ReportingTime: admit.ReportingTime,
      // don't include sensitive fields you don't want public
    };

    return res.status(200).json({ success: true, data: payload });
  } catch (err) {
    next(err);
  }
};

export const markAttendance = async (req, res) => {
  try {
    const { token, scannerUserId } = req.body;

    if (!token) {
      return res.status(400).json({ message: "Token required" });
    }

    let payload;
    try {
      payload = verifyPresentToken(token);
    } catch (err) {
      return res.status(401).json({ message: "Invalid/expired token" });
    }

    if (payload.type !== "admit_present" || !payload.admitCardId) {
      return res.status(400).json({ message: "Bad token payload" });
    }

    const admit = await AdmitCard.findById(payload.admitCardId);
    if (!admit)
      return res.status(404).json({ message: "Admit card not found" });

    // Already present
    if (admit.present) {
      return res.json({
        ok: true,
        alreadyPresent: true,
        admitId: admit._id,
      });
    }

    // Mark present now
    admit.present = true;
    admit.presentedAt = new Date();
    if (scannerUserId) admit.presentedBy = scannerUserId;
    admit.presentTokenUsed = token.slice(0, 32);

    await admit.save();

    return res.json({
      ok: true,
      admitId: admit._id,
      presentedAt: admit.presentedAt,
    });
  } catch (error) {
    console.error("Attendance Mark Error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// Create a new result
export const createResult = async (req, res) => {
  try {
    const { student_ID, A, B, C, D } = req.body;
    const total = A + B + C + D;
    const percentage = (total / 400) * 100;
    let scholarShip = 0;
    // Scholarship logic based on percentage
    if (percentage >= 95) {
      scholarShip = 100;
    } else if (percentage >= 85) {
      scholarShip = 50;
    } else if (percentage >= 75) {
      scholarShip = 25;
    } else if (percentage >= 60) {
      scholarShip = 10;
    } else {
      scholarShip = 0;
    }

    const result = new Result({
      student_ID,
      A,
      B,
      C,
      D,
      total,
      percentage,
      scholarShip,
    });
    await result.save();
    res.status(201).json({ message: "Result created successfully", result });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get all results
export const getAllResults = async (req, res) => {
  try {
    const results = await Result.find().populate(
      "student_ID",
      "fullName email"
    );
    res.status(200).json(results);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get result by student ID
export const getResultByStudentId = async (req, res) => {
  try {
    const { studentId } = req.params;
    const result = await Result.findOne({ student_ID: studentId }).populate(
      "student_ID",
      "fullName email"
    );
    if (!result) {
      return res
        .status(404)
        .json({ message: "Result not found for this student" });
    }
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Update result by ID
export const updateResult = async (req, res) => {
  try {
    const { id } = req.params;
    const { A, B, C, D } = req.body;
    const total = A + B + C + D;
    const percentage = (total / 400) * 100;
    let scholarShip = 0;
    // Scholarship logic based on percentage
    if (percentage >= 95) {
      scholarShip = 100;
    } else if (percentage >= 85) {
      scholarShip = 50;
    } else if (percentage >= 75) {
      scholarShip = 25;
    } else if (percentage >= 60) {
      scholarShip = 10;
    } else {
      scholarShip = 0;
    }
    const updatedResult = await Result.findByIdAndUpdate(
      id,
      { A, B, C, D, total, percentage, scholarShip },
      { new: true }
    );
    if (!updatedResult) {
      return res.status(404).json({ message: "Result not found" });
    }
    res
      .status(200)
      .json({ message: "Result updated successfully", updatedResult });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Delete result by ID
// Delete result by ID
export const deleteResult = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedResult = await Result.findByIdAndDelete(id);
    if (!deletedResult) {
      return res.status(404).json({ message: "Result not found" });
    }
    res
      .status(200)
      .json({ message: "Result deleted successfully", deletedResult });
  } catch (error) {
    console.error("[DELETE RESULT] Server error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// GET ALL RESULTS WITH STUDENT DETAILS
export const getAllResultsWithStudentDetails = async (req, res) => {
  try {
    // Fetch results and populate student details
    const results = await Result.find().populate(
      "student_ID",
      "student_ID fullName email phoneNo collegeName year"
    );
    // Map each result to include custom RSAT ID
    const mappedResults = results.map((result) => {
      let customId = "";
      if (result.student_ID && result.student_ID.student_ID) {
        customId = result.student_ID.student_ID;
      } else if (result.student_ID) {
        customId = result.student_ID;
      }
      return {
        ...result.toObject(),
        student_ID: customId,
      };
    });
    res.status(200).json(mappedResults);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};







const JWT_SECRET = process.env.JWT_SECRET || "change_this_secret_in_prod";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";



/**
 * REGISTER ADMIN / MANAGER / CALLER — only after phone OTP verified
 */
export const registerAdmin = async (req, res, next) => {
  try {
    const { username, phone, password, role } = req.body;

    if (!username || !phone || !password) {
      const err = new Error("username, phone and password are required");
      err.statusCode = 400;
      return next(err);
    }

    // 🔥 Step 1: Check if OTP has been verified
    // If OTP exists in DB → means OR verify nahi hua (bcoz we delete OTP after verify)
    const otpExists = await Otp.findOne({
      otpfor: phone.toString(),
      type: "phone",
    });

    if (otpExists) {
      const err = new Error("Phone not verified. Please verify OTP first.");
      err.statusCode = 400;
      return next(err);
    }

    // 🔥 Step 2: Check if phone already registered
    const existing = await AdminAuth.findOne({ phone: phone.toString() });
    if (existing) {
      const err = new Error("User with this phone already exists");
      err.statusCode = 400;
      return next(err);
    }

    // 🔥 Step 3: Hash password
    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);

    // 🔥 Step 4: Create user (NO student_id, NO reffer_id)
    const newUser = await AdminAuth.create({
      username,
      phone: phone.toString(),
      password: hashed,
      role: role || "caller",
    });

    const safeUser = sanitizeUser(newUser);

    return res.status(201).json({
      message: "Registered successfully",
      user: safeUser,
    });

  } catch (err) {
    next(err);
  }
};
/**
 * SEND OTP to phone (for admin/manager/caller registration verification)
 * Expects: { phone } in req.body
 */
export const sendAdminOtp = async (req, res, next) => {
  try {
    const { phone } = req.body;

    if (!phone || !/^\d{10,15}$/.test(String(phone).trim())) {
      const err = new Error("Valid phone number is required");
      err.statusCode = 400;
      return next(err);
    }

    const phoneStr = phone.toString().trim();

    // Rate-limit / cooldown: check last OTP timestamp
    const lastOtp = await Otp.findOne({ otpfor: phoneStr, type: "phone" }).sort({ createdAt: -1 });
    if (lastOtp && lastOtp.createdAt) {
      const ageMs = Date.now() - new Date(lastOtp.createdAt).getTime();
      const COOLDOWN_MS = 60 * 1000; // 60 seconds
      if (ageMs < COOLDOWN_MS) {
        const err = new Error(`Please wait ${Math.ceil((COOLDOWN_MS - ageMs) / 1000)} seconds before requesting a new OTP`);
        err.statusCode = 429;
        return next(err);
      }
    }

    // Remove any previous OTP entries (cleanup)
    await Otp.deleteMany({ otpfor: phoneStr, type: "phone" });

    // Generate 6-digit OTP
    const plainOtp = Math.floor(100000 + Math.random() * 900000).toString();

    // Attempt to send via SMS (if send fails, still don't reveal OTP)
    try {
      await sendOTPPhone(phoneStr, plainOtp);
    } catch (smsErr) {
      // Log but continue to store hashed OTP so verify can still work if you want.
      console.warn(`[sendAdminOtp] SMS send failed for ${phoneStr}:`, smsErr?.message || smsErr);
      // Optionally: return error here if you want to require SMS success:
      // const err = new Error("Failed to send OTP via SMS");
      // err.statusCode = 502;
      // return next(err);
    }

    // Hash OTP and store
    const hashed = await bcrypt.hash(plainOtp, 10);
    await Otp.create({
      otpfor: phoneStr,
      otp: hashed,
      type: "phone",
      createdAt: new Date(),
    });

    return res.status(200).json({ message: "OTP sent to phone (if SMS gateway succeeded)" });
  } catch (err) {
    next(err);
  }
};

// VERIFY ADMIN OTP

export const verifyAdminOtp = async (req, res, next) => {
  try {
    const { phone, otp } = req.body;

    const otpEntry = await Otp.findOne({
      otpfor: phone.toString(),
      type: "phone",
    });

    if (!otpEntry) {
      return res.status(400).json({ message: "OTP expired or not found" });
    }

    const isCorrect = await bcrypt.compare(otp.toString(), otpEntry.otp);

    if (!isCorrect) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    // OTP VERIFIED → DELETE OTP
    await Otp.deleteMany({ otpfor: phone.toString(), type: "phone" });

    return res.status(200).json({ message: "OTP verified successfully" });

  } catch (err) {
    next(err);
  }
};


/**
 * LOGIN: phone + password
 */
export const loginAdmin  = async (req, res, next) => {
  try {
    const { phone, password } = req.body;

    if (!phone || !password) {
      const err = new Error("phone and password are required");
      err.statusCode = 400;
      return next(err);
    }

    const user = await AdminAuth.findOne({ phone: phone.toString() });
    if (!user) {
      const err = new Error("Invalid credentials");
      err.statusCode = 401;
      return next(err);
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      const err = new Error("Invalid credentials");
      err.statusCode = 401;
      return next(err);
    }

    const payload = {
      id: user._id,
      role: user.role,
      phone: user.phone,
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });

    const safeUser = sanitizeUser(user);

    return res.status(200).json({
      message: "Login successful",
      user: safeUser,
      token,
    });
  } catch (err) {
    next(err);
  }
};


/**
 * LOGOUT HANDLER
 */
export const logoutAdmin = (req, res, next) => {
  try {
    res.clearCookie("token");
    res.status(200).json({ message: "Logout successful" });
  } catch (err) {
    next(err);
  }
};


/**
 * GET PROFILE (requires auth)
 */
export const getProfileAdmin = async (req, res, next) => {
  try {
    const authUser = req.user; // from auth middleware

    if (!authUser || !authUser.id) {
      const err = new Error("Not authenticated");
      err.statusCode = 401;
      return next(err);
    }

    const user = await AdminAuth.findById(authUser.id)
      .select("-password -__v")
      .lean();

    if (!user) {
      const err = new Error("User not found");
      err.statusCode = 404;
      return next(err);
    }

    res.status(200).json({
      message: "Profile fetched successfully",
      user,
    });
  } catch (err) {
    next(err);
  }
};