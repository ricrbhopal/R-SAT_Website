import express from "express";
import {  BookDemoSlot, GetDemoSlots } from "../controller/demoSoltController.js";

const router = express.Router();



// POST /solt/registerSlot -> verify OTPs and book slot
router.post("/registerSlot", BookDemoSlot);
// GET /solt/getAllSlots
router.get("/getAllSlots", GetDemoSlots);
export default router;