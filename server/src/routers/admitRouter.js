// routes/admitCardRoutes.js
import express from "express";
import {
  markAttendanceWithToken,
  generatePresentToken,
  getAdmitCardById,
scanAttendance,
 downloadAdmitCard
} from "../controller/admitCardController.js";

const router = express.Router();


router.get("/:id", getAdmitCardById);
router.post("/mark-attendance", markAttendanceWithToken);
router.post("/:id/present-token", generatePresentToken)
router.get("/scan-attendance/:id", scanAttendance);
router.get("/:id/download", downloadAdmitCard);

export default router;
