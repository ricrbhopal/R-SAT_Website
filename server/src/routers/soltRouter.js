import express from "express";
import {BookDemoSlot,GetDemoSlots  } from "../controller/demoSoltController.js";

const router = express.Router();

// POST /solt/registerSolt
router.post("/registerSolt", BookDemoSlot);
// GET /solt/getAllSolts
router.get("/getAllSolts", GetDemoSlots);
export default router;