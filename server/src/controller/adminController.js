import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
import { sendConfirmationEmail, sendAdmitCardEmail } from "../utils/emailService.js";
import { verifyPresentToken } from "../utils/genAuthToken.js";
import { sendOTPPhone } from "../utils/phoneService.js";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "change_this_secret_in_prod";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

// Utility: remove sensitive fields
function sanitizeUser(user) {
  if (!user) return user;
  const { password, ...rest } = user;
  return rest;
}

// ------------------------------------------------------------------
// Users (Admin / general users)
// ------------------------------------------------------------------

export const getAllUsers = async (req, res, next) => {
  try {
    const users = await prisma.student.findMany({
      select: {
        id: true,
        fullName: true,
        mail_ID: true,
        phoneNo: true,
        student_ID: true,
        college: true,
        branch: true,
        year: true,
        dob: true, // Include password in the fetched data
      },
    });

    return res.status(200).json(users);
  } catch (err) {
    next(err);
  }
};

export const putUserDetails = async (req, res, next) => {
  try {
    const userId = req.params.id;

    // Debugging log
    console.log("Updating user with ID:", userId);

    const updateData = { ...req.body };

    // Validate request body
    if (!updateData || Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: "No data provided for update" });
    }

    // Validate if user exists
    const existingUser = await prisma.student.findUnique({ where: { id: userId } });
    if (!existingUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // If attempting to change password here, hash it
    if (updateData.password) {
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(updateData.password, salt);
    }

    const updatedUser = await prisma.student.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        student_ID: true,
        fullName: true,
        mail_ID: true,
        phoneNo: true,
        college: true,
        branch: true,
        year: true,
        dob: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return res.status(200).json({
      message: "User updated successfully",
      user: updatedUser,
    });
  } catch (err) {
    console.error("Error in putUserDetails:", err);
    // handle not found
    if (err.code === "P2025") {
      return res.status(404).json({ message: "User not found" });
    }
    next(err);
  }
};

export const getUserById = async (req, res, next) => {
  try {
    const userId = req.params.id;
    if (!userId) return res.status(400).json({ message: "Invalid or missing User ID" });

    // Ensure the correct model is used
    const user = await prisma.student.findUnique({
      where: { id: userId },
      select: {
        id: true,
        fullName: true,
        mail_ID: true,
        phoneNo: true,
        student_ID: true,
        college: true,
        branch: true,
        year: true,
        dob: true,
      },
    });

    if (!user) return res.status(404).json({ message: "User not found" });

    return res.status(200).json(user);
  } catch (err) {
    console.error("Error in getUserById:", err);
    next(err);
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    const userId = req.params.id;

    // Ensure the correct model is used
    const deleted = await prisma.student.delete({
      where: { id: userId },
    });

    return res.status(200).json({ message: "User deleted successfully" });
  } catch (err) {
    if (err.code === "P2025") {
      return res.status(404).json({ message: "User not found" });
    }
    console.error("Error in deleteUser:", err);
    next(err);
  }
};

// ------------------------------------------------------------------
// Referred
// ------------------------------------------------------------------

export const getRefferedUsers = async (req, res, next) => {
  try {
    const referredUsers = await prisma.referred.findMany({
      include: {
        referrer: {
          select: {
            student_ID: true,
            fullName: true,
            mail_ID: true,
            phoneNo: true,
          },
        },
      },
    });
    return res.status(200).json(referredUsers);
  } catch (err) {
    next(err);
  }
};

export const putRefferedUserDetails = async (req, res, next) => {
  try {
    const referredId = req.params.id;
    const updateData = req.body;

    const mappedData = {
      referredName: updateData.fullName,
      referredEmail: updateData.mail_ID,
      referredPhone: updateData.phoneNo,
      collegeName: updateData.collegeName,
      year: updateData.year,
      refCode: updateData.refCode,
    };

    const updatedReferred = await prisma.referred.update({
      where: { id: referredId },
      data: mappedData,
      include: {
        referrer: { select: { student_ID: true, fullName: true, mail_ID: true, phoneNo: true } },
      },
    });

    return res.status(200).json({
      message: "Referred user updated successfully",
      referred: updatedReferred,
    });
  } catch (err) {
    if (err.code === "P2025") {
      return res.status(404).json({ message: "Referred user not found" });
    }
    console.error("[putRefferedUserDetails] Error:", err);
    next(err);
  }
};

export const deleteRefferedUser = async (req, res, next) => {
  try {
    const referredId = req.params.id;
    await prisma.referred.delete({ where: { id: referredId } });
    return res.status(200).json({ message: "Referred user deleted successfully" });
  } catch (err) {
    if (err.code === "P2025") {
      return res.status(404).json({ message: "Referred user not found" });
    }
    next(err);
  }
};

export const getRefferedUserById = async (req, res, next) => {
  try {
    const referredId = req.params.id;
    const referredUser = await prisma.referred.findUnique({
      where: { id: referredId },
      include: { referrer: { select: { student_ID: true, fullName: true, mail_ID: true, phoneNo: true } } },
    });
    if (!referredUser) return res.status(404).json({ message: "Referred user not found" });
    return res.status(200).json(referredUser);
  } catch (err) {
    next(err);
  }
};

// ------------------------------------------------------------------
// Demo Classes
// ------------------------------------------------------------------

export const getAllDemoClasses = async (req, res, next) => {
  try {
    const demoClasses = await prisma.demoClass.findMany();
    return res.status(200).json(demoClasses);
  } catch (err) {
    next(err);
  }
};

export const getDemoClassById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const demoClass = await prisma.demoClass.findUnique({ where: { id } });
    if (!demoClass) return res.status(404).json({ message: "Demo class not found" });
    return res.status(200).json(demoClass);
  } catch (err) {
    next(err);
  }
};

export const deleteDemoClass = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ message: "ID is required" });

    await prisma.demoClass.delete({ where: { id } });
    return res.status(200).json({ message: "Demo class deleted successfully" });
  } catch (err) {
    if (err.code === "P2025") {
      return res.status(404).json({ message: "Demo class not found" });
    }
    console.error("Error deleting demo class:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

export const putDemoClassDetails = async (req, res, next) => {
  try {
    const demoClassId = req.params.id;
    const updateData = req.body;

    const updatedDemoClass = await prisma.demoClass.update({
      where: { id: demoClassId },
      data: updateData,
    });

    // Send confirmation email if email present
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
      } catch (emailErr) {
        console.error("Failed to send confirmation email:", emailErr);
      }
    }

    return res.status(200).json({
      message: "Demo class updated successfully",
      demoClass: updatedDemoClass,
    });
  } catch (err) {
    if (err.code === "P2025") {
      return res.status(404).json({ message: "Demo class not found" });
    }
    next(err);
  }
};

// ------------------------------------------------------------------
// Support Queries
// ------------------------------------------------------------------

export const GetAllSupportQueries = async (req, res, next) => {
  try {
    const filter = {};
    const where = {};
    if (req.query.status) {
      const allowed = ["open", "in_progress", "resolved"];
      if (!allowed.includes(req.query.status)) {
        return res.status(400).json({ message: "Invalid status filter" });
      }
      where.status = req.query.status;
    }
    const queries = await prisma.supportQuery.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        student: { select: { fullName: true, mail_ID: true, phoneNo: true } },
      },
    });

    return res.status(200).json(queries);
  } catch (err) {
    next(err);
  }
};

export const GetStudentSupportQueries = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) return res.status(401).json({ message: "Authentication required" });

    const studentId = req.user.id;
    const queries = await prisma.supportQuery.findMany({
      where: { studentId },
      orderBy: { createdAt: "desc" },
      include: { student: { select: { fullName: true, mail_ID: true, phoneNo: true } } },
    });
    return res.status(200).json(queries);
  } catch (err) {
    next(err);
  }
};

export const UpdateSupportQueryStatus = async (req, res, next) => {
  try {
    const { queryId } = req.params;
    const { status } = req.body;

    const allowed = ["open", "in_progress", "resolved"];
    if (!allowed.includes(status)) return res.status(400).json({ message: "Invalid status value" });

    const updated = await prisma.supportQuery.update({
      where: { id: queryId },
      data: { status },
      include: { student: { select: { fullName: true, mail_ID: true, phoneNo: true } } },
    });

    return res.status(200).json({ message: "Support query status updated", query: updated });
  } catch (err) {
    if (err.code === "P2025") return res.status(404).json({ message: "Support query not found" });
    next(err);
  }
};

export const AddSupportQueryResponse = async (req, res, next) => {
  try {
    const { queryId } = req.params;
    const { message, responder } = req.body;

    if (!message) return res.status(400).json({ message: "Response message is required" });

    const responderName = (req.user && (req.user.name || req.user.fullName)) || responder;
    if (!responderName) {
      return res.status(400).json({ message: "Responder name required (authenticate or send responder in body)" });
    }

    // push responses array: Prisma requires JSON field or separate table. Assuming 'responses' is a JSON array field.
    // We'll read current, push, and update.
    const current = await prisma.supportQuery.findUnique({ where: { id: queryId }, select: { responses: true } });
    if (!current) return res.status(404).json({ message: "Support query not found" });

    const newResponses = Array.isArray(current.responses) ? [...current.responses] : [];
    newResponses.push({ responder: responderName, message, date: new Date().toISOString() });

    const updated = await prisma.supportQuery.update({
      where: { id: queryId },
      data: { responses: newResponses, status: "in_progress" },
      include: { student: { select: { fullName: true, mail_ID: true, phoneNo: true } } },
    });

    return res.status(200).json({ message: "Response added to support query", query: updated });
  } catch (err) {
    next(err);
  }
};

export const DeleteSupportQuery = async (req, res, next) => {
  try {
    const { queryId } = req.params;
    await prisma.supportQuery.delete({ where: { id: queryId } });
    return res.status(200).json({ message: "Support query deleted successfully" });
  } catch (err) {
    if (err.code === "P2025") return res.status(404).json({ message: "Support query not found" });
    next(err);
  }
};

// ------------------------------------------------------------------
// Admit Cards (bulk create, get, update, delete, public view, attendance)
// ------------------------------------------------------------------

const genRSAT = () => "RSAT-" + crypto.randomBytes(4).toString("hex").toUpperCase();

export const bulkCreateAdmitCards = async (req, res) => {
  try {
    const { venue, examDate, examTime, ReportingTime } = req.body;
    if (!venue || !examDate || !examTime || !ReportingTime) {
      return res.status(400).json({ message: "All fields are required." });
    }

    // Fetch all students (assuming prisma.user has student records)
    const students = await prisma.user.findMany();
    if (!students || students.length === 0) {
      return res.status(400).json({ message: "No students found to create admit cards." });
    }

    // create admit cards one by one (so we get created records)
    const createdAdmitCards = [];
    for (const student of students) {
      const applicantName = student.fullName || student.name || "";
      const contact = student.phoneNo || student.phone || student.email || "";
      const rsat = student.student_ID || genRSAT();
      const doc = await prisma.admitCard.create({
        data: {
          studentId: student.id,
          ApplicantName: applicantName,
          contact,
          college: student.college || "",
          branch: student.branch || "",
          year: student.year || "",
          RSAT: rsat,
          venue,
          examDate: new Date(examDate),
          examTime,
          ReportingTime,
        },
      });
      createdAdmitCards.push(doc);
    }

    // Build map of students by id
    const studentMap = new Map(students.map((s) => [String(s.id), s]));

    // Send emails
    const results = await Promise.all(
      createdAdmitCards.map(async (admitCard) => {
        const student = studentMap.get(String(admitCard.studentId)) || (await prisma.user.findUnique({ where: { id: admitCard.studentId } }));

        const emailCandidates = [student?.mail_ID, student?.mailId, student?.email, student?.mail, student?.contactEmail].filter(Boolean);
        const resolvedEmail = Array.isArray(emailCandidates[0]) ? emailCandidates[0][0] : emailCandidates[0];

        if (!resolvedEmail) {
          await prisma.admitCard.update({
            where: { id: admitCard.id },
            data: { emailSent: false, emailSentAt: null, emailError: "Student email not found (mail_ID/email/mailId)" },
          });
          return { admitCardId: admitCard.id, success: false, error: "Student email not found" };
        }

        const studentForEmail = { ...student, email: resolvedEmail };

        try {
          const response = await sendAdmitCardEmail(studentForEmail, [admitCard], {
            attachFiles: [],
            dashboardPath: "/student/dashboard",
            sendIndividually: false,
          });

          if (response && response.success) {
            await prisma.admitCard.update({ where: { id: admitCard.id }, data: { emailSent: true, emailSentAt: new Date(), emailError: null } });
            return { admitCardId: admitCard.id, success: true, sentTo: response.sentTo || [resolvedEmail] };
          } else {
            const errMsg = response && response.error ? response.error : "Unknown send failure";
            await prisma.admitCard.update({ where: { id: admitCard.id }, data: { emailSent: false, emailSentAt: null, emailError: String(errMsg) } });
            return { admitCardId: admitCard.id, success: false, error: String(errMsg) };
          }
        } catch (err) {
          await prisma.admitCard.update({
            where: { id: admitCard.id },
            data: { emailSent: false, emailSentAt: null, emailError: err.message || String(err) },
          });
          console.error(`Email send error for admit ${admitCard.id} -> ${resolvedEmail}:`, err);
          return { admitCardId: admitCard.id, success: false, error: String(err.message || err) };
        }
      })
    );

    return res.status(201).json({
      message: "Admit cards created successfully for all students.",
      createdCount: createdAdmitCards.length,
      emailResults: results,
    });
  } catch (err) {
    console.error("Error creating admit cards:", err);
    return res.status(500).json({ message: "Failed to create admit cards.", error: String(err.message || err) });
  }
};

export const getAllAdmitCards = async (req, res, next) => {
  try {
    const { page = 1, limit = 50, status, search } = req.query;
    const where = {};
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { ApplicantName: { contains: search, mode: "insensitive" } },
        { RSAT: { contains: search, mode: "insensitive" } },
        { college: { contains: search, mode: "insensitive" } },
        { contact: { contains: search, mode: "insensitive" } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [total, data] = await Promise.all([
      prisma.admitCard.count({ where }),
      prisma.admitCard.findMany({
        where,
        orderBy: [{ examDate: "asc" }, { createdAt: "desc" }],
        skip,
        take: Number(limit),
        include: { student: { select: { fullName: true, email: true } } },
      }),
    ]);

    return res.status(200).json({ total, page: Number(page), limit: Number(limit), data });
  } catch (err) {
    next(err);
  }
};

export const getAdmitCardById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const admitCard = await prisma.admitCard.findUnique({ where: { id }, include: { student: { select: { fullName: true, email: true } } } });
    if (!admitCard) return res.status(404).json({ message: "Admit card not found" });
    res.status(200).json(admitCard);
  } catch (err) {
    next(err);
  }
};

export const updateAdmitCard = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updated = await prisma.admitCard.update({ where: { id }, data: req.body });
    return res.status(200).json({ message: "Admit card updated successfully", admitCard: updated });
  } catch (err) {
    if (err.code === "P2002") {
      return res.status(409).json({ message: "Duplicate value error", details: err.meta });
    }
    if (err.code === "P2025") {
      return res.status(404).json({ message: "Admit card not found" });
    }
    next(err);
  }
};

export const deleteAdmitCard = async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.admitCard.delete({ where: { id } });
    return res.status(200).json({ message: "Admit card deleted successfully" });
  } catch (err) {
    if (err.code === "P2025") return res.status(404).json({ message: "Admit card not found" });
    next(err);
  }
};

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

    const admitCard = await prisma.admitCard.update({ where: { id }, data: updates, include: { student: { select: { fullName: true, email: true } } } });

    if (!admitCard) return res.status(404).json({ message: "Admit card not found" });

    if (status === "issued" && admitCard.student && admitCard.student.email) {
      try {
        const admits = [{ _id: admitCard.id, admitToken: admitCard.admitToken, examDate: admitCard.examDate, venue: admitCard.venue, examTime: admitCard.examTime, ReportingTime: admitCard.ReportingTime }];

        await sendAdmitCardEmail({ name: admitCard.student.fullName, email: admitCard.student.email }, admits, { subject: "Your Admit Card is Issued" });

        await prisma.admitCard.update({ where: { id }, data: { emailSent: true, emailSentAt: new Date(), emailError: null } });
      } catch (emailErr) {
        console.error("Email send failed:", emailErr);
        await prisma.admitCard.update({ where: { id }, data: { emailSent: false, emailSentAt: null, emailError: emailErr.message || String(emailErr) } });
        return res.status(200).json({
          message: "Admit card status updated to 'issued' but failed to send email",
          admitCard,
          emailError: emailErr.message || String(emailErr),
        });
      }
    }

    return res.status(200).json({ message: "Admit card status updated successfully", admitCard });
  } catch (err) {
    next(err);
  }
};

export const bulkUpdateAdmitCards = async (req, res) => {
  try {
    const { venue, examDate, examTime, ReportingTime } = req.body;
    if (!venue || !examDate || !examTime || !ReportingTime) {
      return res.status(400).json({ message: "All fields are required." });
    }

    const updated = await prisma.admitCard.updateMany({
      data: { venue, examDate: new Date(examDate), examTime, ReportingTime },
    });

    if (updated.count === 0) {
      return res.status(404).json({ message: "No admit cards were updated." });
    }

    return res.status(200).json({ message: "Admit cards updated successfully.", updatedCount: updated.count });
  } catch (err) {
    console.error("Error updating admit cards:", err);
    return res.status(500).json({ message: "Failed to update admit cards.", error: String(err.message || err) });
  }
};

export const getPublicAdmitCard = async (req, res, next) => {
  try {
    const { idOrRsat } = req.params;
    let admit = null;
    // If looks like ObjectId (24 hex) try id
    if (/^[0-9a-fA-F]{24}$/.test(idOrRsat)) {
      admit = await prisma.admitCard.findUnique({ where: { id: idOrRsat }, include: { student: { select: { fullName: true, email: true, phoneNo: true } } } });
    }
    if (!admit) {
      admit = await prisma.admitCard.findFirst({ where: { RSAT: idOrRsat }, include: { student: { select: { fullName: true, email: true, phoneNo: true } } } });
    }
    if (!admit) return res.status(404).json({ message: "Admit card not found" });

    const payload = {
      id: admit.id,
      RSAT: admit.RSAT,
      ApplicantName: admit.ApplicantName || admit.student?.fullName,
      contact: admit.contact || admit.student?.phoneNo || admit.student?.email,
      college: admit.college || admit.student?.college,
      branch: admit.branch || admit.student?.branch,
      year: admit.year || admit.student?.year,
      venue: admit.venue,
      examDate: admit.examDate,
      examTime: admit.examTime,
      ReportingTime: admit.ReportingTime,
    };

    return res.status(200).json({ success: true, data: payload });
  } catch (err) {
    next(err);
  }
};

export const markAttendance = async (req, res) => {
  try {
    const { token, scannerUserId } = req.body;
    if (!token) return res.status(400).json({ message: "Token required" });

    let payload;
    try {
      payload = verifyPresentToken(token);
    } catch (err) {
      return res.status(401).json({ message: "Invalid/expired token" });
    }

    if (payload.type !== "admit_present" || !payload.admitCardId) {
      return res.status(400).json({ message: "Bad token payload" });
    }

    const admit = await prisma.admitCard.findUnique({ where: { id: payload.admitCardId } });
    if (!admit) return res.status(404).json({ message: "Admit card not found" });

    if (admit.present) {
      return res.json({ ok: true, alreadyPresent: true, admitId: admit.id });
    }

    const updated = await prisma.admitCard.update({
      where: { id: admit.id },
      data: { present: true, presentedAt: new Date(), presentedBy: scannerUserId || null, presentTokenUsed: token.slice(0, 32) },
    });

    return res.json({ ok: true, admitId: updated.id, presentedAt: updated.presentedAt });
  } catch (err) {
    console.error("Attendance Mark Error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// ------------------------------------------------------------------
// Results
// ------------------------------------------------------------------

export const createResult = async (req, res) => {
  try {
    const { student_ID, A, B, C, D } = req.body;
    const total = Number(A) + Number(B) + Number(C) + Number(D);
    const percentage = (total / 400) * 100;
    let scholarShip = 0;
    if (percentage >= 95) scholarShip = 100;
    else if (percentage >= 85) scholarShip = 50;
    else if (percentage >= 75) scholarShip = 25;
    else if (percentage >= 60) scholarShip = 10;

    const result = await prisma.result.create({
      data: { student_ID, A, B, C, D, total, percentage, scholarShip },
    });

    return res.status(201).json({ message: "Result created successfully", result });
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

export const getAllResults = async (req, res) => {
  try {
    const results = await prisma.result.findMany({
      include: { student: { select: { fullName: true, email: true } } },
    });
    return res.status(200).json(results);
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

export const getResultByStudentId = async (req, res) => {
  try {
    const { studentId } = req.params;
    const result = await prisma.result.findFirst({ where: { student_ID: studentId }, include: { student: { select: { fullName: true, email: true } } } });
    if (!result) return res.status(404).json({ message: "Result not found for this student" });
    return res.status(200).json(result);
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

export const updateResult = async (req, res) => {
  try {
    const { id } = req.params;
    const { A, B, C, D } = req.body;
    const total = Number(A) + Number(B) + Number(C) + Number(D);
    const percentage = (total / 400) * 100;
    let scholarShip = 0;
    if (percentage >= 95) scholarShip = 100;
    else if (percentage >= 85) scholarShip = 50;
    else if (percentage >= 75) scholarShip = 25;
    else if (percentage >= 60) scholarShip = 10;

    const updatedResult = await prisma.result.update({
      where: { id },
      data: { A, B, C, D, total, percentage, scholarShip },
    });

    return res.status(200).json({ message: "Result updated successfully", updatedResult });
  } catch (err) {
    if (err.code === "P2025") return res.status(404).json({ message: "Result not found" });
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

export const deleteResult = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.result.delete({ where: { id } });
    return res.status(200).json({ message: "Result deleted successfully" });
  } catch (err) {
    if (err.code === "P2025") return res.status(404).json({ message: "Result not found" });
    console.error("[DELETE RESULT] Server error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

export const getAllResultsWithStudentDetails = async (req, res) => {
  try {
    const results = await prisma.result.findMany({
      include: { student: { select: { student_ID: true, fullName: true, email: true, phoneNo: true, collegeName: true, year: true } } },
    });

    const mappedResults = results.map((result) => {
      const customId = result.student?.student_ID || result.studentId || result.student || null;
      return { ...result, student_ID: customId };
    });

    return res.status(200).json(mappedResults);
  } catch (err) {
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

// ------------------------------------------------------------------
// Admin registration / OTP / Login
// ------------------------------------------------------------------

export const registerAdmin = async (req, res, next) => {
  try {
    const { username, phone, password, role } = req.body;
    console.log("Request Body:", req.body); // Debugging

    if (!username || !phone || !password) {
      return res.status(400).json({ message: "username, phone, and password are required" });
    }

    const existing = await prisma.admin.findUnique({
      where: { phone: phone.toString() },
    });
    if (existing) {
      return res.status(400).json({ message: "User with this phone already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);

    const newUser = await prisma.admin.create({
      data: { username, phone: phone.toString(), password: hashed, role: role || "caller" },
    });

    return res.status(201).json({ message: "Registered successfully", user: newUser });
  } catch (err) {
    console.error("Error in registerAdmin:", err); // Debugging
    next(err);
  }
};
export const sendAdminOtp = async (req, res, next) => {
  try {
    const { phone } = req.body;
    if (!phone || !/^\d{10,15}$/.test(String(phone).trim())) return res.status(400).json({ message: "Valid phone number is required" });

    const phoneStr = phone.toString().trim();

    const lastOtp = await prisma.otp.findFirst({ where: { otpfor: phoneStr, type: "phone" }, orderBy: { createdAt: "desc" } });
    if (lastOtp && lastOtp.createdAt) {
      const ageMs = Date.now() - new Date(lastOtp.createdAt).getTime();
      const COOLDOWN_MS = 60 * 1000;
      if (ageMs < COOLDOWN_MS) return res.status(429).json({ message: `Please wait ${Math.ceil((COOLDOWN_MS - ageMs) / 1000)} seconds before requesting a new OTP` });
    }

    await prisma.otp.deleteMany({ where: { otpfor: phoneStr, type: "phone" } });

    const plainOtp = Math.floor(100000 + Math.random() * 900000).toString();

    try {
      await sendOTPPhone(phoneStr, plainOtp);
    } catch (smsErr) {
      console.warn(`[sendAdminOtp] SMS send failed for ${phoneStr}:`, smsErr?.message || smsErr);
    }

    const hashed = await bcrypt.hash(plainOtp, 10);
    await prisma.otp.create({ data: { otpfor: phoneStr, otp: hashed, type: "phone", createdAt: new Date() } });

    return res.status(200).json({ message: "OTP sent to phone (if SMS gateway succeeded)" });
  } catch (err) {
    next(err);
  }
};

export const verifyAdminOtp = async (req, res, next) => {
  try {
    const { phone, otp } = req.body;
    const otpEntry = await prisma.otp.findFirst({ where: { otpfor: phone.toString(), type: "phone" } });
    if (!otpEntry) return res.status(400).json({ message: "OTP expired or not found" });

    const isCorrect = await bcrypt.compare(otp.toString(), otpEntry.otp);
    if (!isCorrect) return res.status(400).json({ message: "Invalid OTP" });

    await prisma.otp.deleteMany({ where: { otpfor: phone.toString(), type: "phone" } });
    return res.status(200).json({ message: "OTP verified successfully" });
  } catch (err) {
    next(err);
  }
};

export const loginAdmin = async (req, res, next) => {
  try {
    const { phone, password } = req.body;
    console.log("[loginAdmin] Request body:", { phone, password });

    if (!phone || !password) {
      console.error("[loginAdmin] Missing phone or password");
      return res.status(400).json({ message: "phone and password are required" });
    }

    if (!prisma || !prisma.admin) {
      console.error("[loginAdmin] Prisma client is not initialized");
      return res.status(500).json({ message: "Internal server error" });
    }

    const user = await prisma.admin.findUnique({ where: { phone: phone.toString() } });
    console.log("[loginAdmin] User found:", user);

    if (!user) {
      console.error("[loginAdmin] Invalid credentials: user not found");
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    console.log("[loginAdmin] Password match:", isMatch);

    if (!isMatch) {
      console.error("[loginAdmin] Invalid credentials: password mismatch");
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const payload = { id: user.id, role: user.role, phone: user.phone };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    console.log("[loginAdmin] Token generated:", token);

    res.cookie("token", token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" });

    const safeUser = sanitizeUser(user);
    return res.status(200).json({ message: "Login successful", user: safeUser, token });
  } catch (err) {
    console.error("[loginAdmin] Error:", err);
    next(err);
  }
};

export const logoutAdmin = (req, res, next) => {
  try {
    res.clearCookie("token");
    return res.status(200).json({ message: "Logout successful" });
  } catch (err) {
    next(err);
  }
};

export const getAdminProfileById = async (req, res, next) => {
  try {
    const userId = req.params.id;
    if (!userId) return res.status(400).json({ message: "User ID required" });

    const user = await prisma.adminAuth.findUnique({ where: { id: userId }, select: { password: false, id: true, username: true, phone: true, role: true } });
    if (!user) return res.status(404).json({ message: "Admin user not found" });

    return res.status(200).json({ success: true, message: "Admin profile retrieved", user });
  } catch (err) {
    console.error("[getAdminProfileById] Error:", err);
    next(err);
  }
};

// Debug Prisma client models
console.log('[DEBUG] Prisma client models:', Object.keys(prisma));
