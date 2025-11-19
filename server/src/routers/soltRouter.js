import express from "express";
import { SendDemoOTP, BookDemoSlot, GetDemoSlots } from "../controller/demoSoltController.js";

const router = express.Router();

// POST /solt/send-otp  -> send OTPs to email & phone
router.post("/send-otp", SendDemoOTP);

// POST /solt/registerSlot -> verify OTPs and book slot
router.post("/registerSlot", BookDemoSlot);
// GET /solt/getAllSlots
router.get("/getAllSlots", GetDemoSlots);
export default router;