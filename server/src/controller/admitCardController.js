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

export const generatePresentToken = async (req, res) => {
  try {
    const id = req.params.id;
    if (!id) return res.status(400).json({ message: "Missing id" });

    const admit = await AdmitCard.findById(id);
    if (!admit) return res.status(404).json({ message: "Admit card not found" });

    // create short-lived token (server-side secret)
    const token = createPresentToken(id);

    // Optionally store token audit or return directly
    return res.json({ ok: true, token });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

export const markAttendanceWithToken = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ message: "Missing token" });

    let payload;
    try {
      payload = verifyPresentToken(token); // will throw if invalid/expired
    } catch (err) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    const id = payload.admitCardId;
    const admit = await AdmitCard.findById(id);
    if (!admit) return res.status(404).json({ message: "Admit card not found" });

    if (admit.present) {
      return res.json({ ok: true, alreadyPresent: true, message: "Attendance already marked" });
    }

    admit.present = true;
    admit.attendanceAt = new Date();
    await admit.save();

    return res.json({ ok: true, message: "Attendance marked successfully" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
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
