import express from "express";
import { SendDemoOTP, BookDemoSlot, GetDemoSlots } from "../controller/demoSoltController.js";

const router = express.Router();

// POST /solt/send-otp  -> send OTPs to email & phone
router.post("/send-otp", SendDemoOTP);

// POST /solt/registerSolt -> verify OTPs and book slot
router.post("/registerSolt", BookDemoSlot);
// GET /solt/getAllSolts
router.get("/getAllSolts", GetDemoSlots);
export default router;