// routes/referralRoutes.js
import express from "express";
import {
  createReferral,
  getReferralInfo,
  registerWithReferral,
} from "../controller/refferedController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// create referral (authenticated)
router.post("/create", protect, createReferral);

// get referral info (public)
router.get("/info/:code", getReferralInfo);

// register via referral (public)
router.post("/register", registerWithReferral);

export default router;
