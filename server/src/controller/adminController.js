import AuthModel from "../models/authModel.js";
import Referred from "../models/refferedModel.js";
import DemoClass from "../models/demoModel.js";
import SupportQuery from "../models/supportQueriesModel.js"; // आपका schema file
import {sendConfirmationEmail } from "../utils/emailService.js";
// controllers/admitCardController.js
import AdmitCard from "../models/admitCardmodel.js";
import {sendAdmitCardEmail } from "../utils/emailService.js";
import crypto from "crypto";
import Student from "../models/authModel.js";
import mongoose from "mongoose";

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

    res
      .status(200)
      .json({
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
    const updatedDemoClass = await DemoClass.findByIdAndUpdate(demoClassId, updateData, {
      new: true,
    });
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
        console.log("Confirmation email sent successfully to:", updatedDemoClass.email);
      } catch (emailError) {
        console.error("Failed to send confirmation email:", emailError);
      }
    }

    res
      .status(200)
      .json({ message: "Demo class updated successfully", demoClass: updatedDemoClass });
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

    console.log("Fetched Queries:", queries); // Debugging log

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

    return res.status(200).json({ message: "Support query deleted successfully" });
  } catch (error) {
    next(error);
  }
};






/** helper: generate short unique RSAT */
const genRSAT = () => "RSAT-" + crypto.randomBytes(4).toString("hex").toUpperCase();

/**
 * Bulk create admit cards and send emails (uses sendAdmitCardEmail)
 */
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
      return res.status(400).json({ message: "No students found to create admit cards." });
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
    const results = await Promise.all(createdAdmitCards.map(async (admitCard) => {
      const student = studentMap.get(String(admitCard.studentId)) || await Student.findById(admitCard.studentId);

      // resolve the email address field(s) — try common field names
      const emailCandidates = [
        student?.mail_ID,
        student?.mailId,
        student?.email,
        student?.mail,
        student?.contactEmail,
      ].filter(Boolean);

      // prefer first valid email
      const resolvedEmail = Array.isArray(emailCandidates[0]) ? emailCandidates[0][0] : emailCandidates[0];

      if (!resolvedEmail) {
        // update DB: email missing
        admitCard.emailSent = false;
        admitCard.emailSentAt = null;
        admitCard.emailError = "Student email not found (mail_ID/email/mailId)";
        await admitCard.save();
        return { admitCardId: admitCard._id, success: false, error: admitCard.emailError };
      }

      // Use sendAdmitCardEmail helper: it expects `student` with `.email` OR an email string in args.
      // We'll call sendAdmitCardEmail(studentObj, [admitCard], opts) — but ensure student.email exists.
      const studentForEmail = { ...student.toObject ? student.toObject() : student, email: resolvedEmail };

      try {
        // sendIndividually=false will send one email containing the admit card details (function you provided)
        const response = await sendAdmitCardEmail(studentForEmail, [admitCard], {
          attachFiles: [], // pass attachments if you have
          dashboardPath: "/student/dashboard",
          sendIndividually: false,
        });

        if (response && response.success) {
          admitCard.emailSent = true;
          admitCard.emailSentAt = new Date();
          admitCard.emailError = null;
          await admitCard.save();
          return { admitCardId: admitCard._id, success: true, sentTo: response.sentTo || [resolvedEmail] };
        } else {
          const errMsg = response && response.error ? response.error : "Unknown send failure";
          admitCard.emailSent = false;
          admitCard.emailSentAt = null;
          admitCard.emailError = String(errMsg);
          await admitCard.save();
          return { admitCardId: admitCard._id, success: false, error: String(errMsg) };
        }
      } catch (err) {
        // sendAdmitCardEmail threw
        admitCard.emailSent = false;
        admitCard.emailSentAt = null;
        admitCard.emailError = err.message || String(err);
        await admitCard.save();
        console.error(`Email send error for admit ${admitCard._id} -> ${resolvedEmail}:`, err);
        return { admitCardId: admitCard._id, success: false, error: String(err.message || err) };
      }
    }));

    // return inserted count + email send summary
    return res.status(201).json({
      message: "Admit cards created successfully for all students.",
      createdCount: createdAdmitCards.length,
      emailResults: results,
    });
  } catch (error) {
    console.error("Error creating admit cards:", error);
    return res.status(500).json({ message: "Failed to create admit cards.", error: String(error.message || error) });
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
      query.$or = [{ ApplicantName: re }, { RSAT: re }, { college: re }, { contact: re }];
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

    return res.status(200).json({ total, page: Number(page), limit: Number(limit), data });
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
    const admitCard = await AdmitCard.findById(id).populate("studentId", "fullName email");
    if (!admitCard) return res.status(404).json({ message: "Admit card not found" });
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
    const updated = await AdmitCard.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
    if (!updated) return res.status(404).json({ message: "Admit card not found" });
    res.status(200).json({ message: "Admit card updated successfully", admitCard: updated });
  } catch (err) {
    // duplicate key handling
    if (err.code === 11000) {
      return res.status(409).json({ message: "Duplicate value error", details: err.keyValue });
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
    if (!removed) return res.status(404).json({ message: "Admit card not found" });
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
      return res.status(400).json({ message: "Invalid status. Use 'issued' or 'not_issued'." });
    }

    const updates = { status };
    if (status === "issued") {
      updates.issuedAt = new Date();
      if (issuedBy) updates.issuedBy = issuedBy;
    } else {
      updates.issuedAt = null;
      updates.issuedBy = null;
    }

    const admitCard = await AdmitCard.findByIdAndUpdate(id, updates, { new: true }).populate("studentId", "fullName email");

    if (!admitCard) return res.status(404).json({ message: "Admit card not found" });

    // send email if issued and student email exists
    if (status === "issued" && admitCard.studentId && admitCard.studentId.email) {
      try {
        const admits = [{
          _id: admitCard._id,
          admitToken: admitCard.admitToken,
          examDate: admitCard.examDate,
          venue: admitCard.venue,
          examTime: admitCard.examTime,
          ReportingTime: admitCard.ReportingTime,
        }];

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
          message: "Admit card status updated to 'issued' but failed to send email",
          admitCard,
          emailError: admitCard.emailError,
        });
      }
    }

    return res.status(200).json({ message: "Admit card status updated successfully", admitCard });
  } catch (err) {
    next(err);
  }
};
