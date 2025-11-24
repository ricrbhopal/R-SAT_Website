// routes/admitCardRoutes.js
import express from "express";
import {
  markAttendanceWithToken,
  generatePresentToken,
  getAdmitCardById,
scanAttendance
} from "../controller/admitCardController.js";

const router = express.Router();


router.get("/:id", getAdmitCardById);
router.post("/mark-attendance", markAttendanceWithToken);
router.post("/:id/present-token", generatePresentToken)
router.get("/scan-attendance", scanAttendance);

export default router;
