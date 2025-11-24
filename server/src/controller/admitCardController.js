// controllers/admitCardController.js
import AdmitCard from "../models/admitCardmodel.js";




// ...existing imports...

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