// routes/supportRoutes.js
import express from "express";
import {
  SubmitSupportQuery,
  GetStudentSupportQueries,
  GetAllSupportQueries,
  UpdateSupportQueryStatus,
  AddSupportQueryResponse
} from "../controller/supportController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/submit-query", protect, SubmitSupportQuery);
router.get("/student-queries", protect, GetStudentSupportQueries);
router.get("/all-queries", protect, GetAllSupportQueries);
router.put("/update-status/:queryId", protect, UpdateSupportQueryStatus);
router.post("/:queryId/respond", protect, AddSupportQueryResponse);

export default router;
