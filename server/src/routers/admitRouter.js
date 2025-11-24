// server/src/routes/admitCardRoutes.js
import express from "express";
import { generatePresentToken, markAttendanceWithToken, scanAttendance } from "../controller/admitCardController.js";
import isAdmin from "../middleware/authMiddleware.js";

const router = express.Router();

// public: show admit card (no marking)
// router.get("/:id", getAdmitCardById)  // existing

// admin-only: generate present token
router.post("/:id/present-token", isAdmin, generatePresentToken);

// public or admin: mark attendance using token (token itself authorizes)
router.post("/mark-attendance", markAttendanceWithToken);

// optional: QR-based public landing page (no marking)
router.get("/scan-attendance/:id", scanAttendance);

export default router;
