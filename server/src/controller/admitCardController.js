// controllers/admitCardController.js
import AdmitCard from "../models/admitCardmodel.js";




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

