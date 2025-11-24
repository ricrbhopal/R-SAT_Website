// controllers/admitCardController.js
import AdmitCard from "../models/admitCardmodel.js";
import { createPresentToken, verifyPresentToken } from "../utils/genAuthToken.js";

/**
 * Get Admit Card by ID or student_ID
 * GET /api/admitcards/:id
 * If :id is a valid ObjectId, search by _id.
 * Otherwise, search by RSAT (student_ID).
 */
export const getAdmitCardById = async (req, res, next) => {
  try {
    const { id } = req.params;
    let admitCard = null;

    // Check if id is a valid ObjectId
    if (/^[0-9a-fA-F]{24}$/.test(id)) {
      admitCard = await AdmitCard.findById(id).populate("studentId", "fullName email");
    } else {
      // Otherwise, search by RSAT (student_ID)
      admitCard = await AdmitCard.findOne({ RSAT: id }).populate("studentId", "fullName email");
    }

    if (!admitCard) return res.status(404).json({ message: "Admit card not found" });
    res.status(200).json(admitCard);
  } catch (err) {
    next(err);
  }
};

/**
 * Generate a present token for a given admit card
 * POST /api/admitcards/:id/present-token
 * Returns: { token }
 */
export const generatePresentToken = async (req, res, next) => {
  try {
    const { id } = req.params;
    const admitCard = await AdmitCard.findById(id);
    if (!admitCard) return res.status(404).json({ message: "Admit card not found" });
    const token = createPresentToken(admitCard._id);
    res.status(200).json({ token });
  } catch (err) {
    next(err);
  }
};

/**
 * Mark attendance using present token
 * POST /api/admitcards/mark-attendance
 * Body: { token }
 */
export const markAttendanceWithToken = async (req, res, next) => {
  try {
    const { token } = req.body;
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
    const admit = await AdmitCard.findById(payload.admitCardId);
    if (!admit) return res.status(404).json({ message: "Admit card not found" });
    if (admit.present) {
      return res.json({ ok: true, alreadyPresent: true, admitId: admit._id });
    }
    admit.present = true;
    admit.presentedAt = new Date();
    admit.presentTokenUsed = token.slice(0, 32);
    await admit.save();
    return res.json({ ok: true, admitId: admit._id, presentedAt: admit.presentedAt });
  } catch (err) {
    next(err);
  }
};


export const scanAttendance = async (req, res) => {
  try {
    const id = req.params.id;               // <- changed to params
    if (!id) return res.status(400).json({ message: "Missing admitCardId" });

    const admit = await AdmitCard.findById(id);
    if (!admit) return res.status(404).json({ message: "Admit card not found" });

    if (admit.present) return res.json({ message: "Attendance already marked" });

    admit.present = true;
    admit.attendanceAt = new Date();
    await admit.save();

    return res.json({ message: "Attendance marked successfully" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Error marking attendance" });
  }
};
