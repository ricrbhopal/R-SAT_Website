// routes/supportRoutes.js
import express from "express";
import {
  SubmitSupportQuery,
  GetStudentSupportQueries,
  GetAllSupportQueries,
  UpdateSupportQueryStatus,
  AddSupportQueryResponse,
} from "../controller/supportController.js";
import { protect } from "../middleware/authMiddleware.js";
import { uploadSingleImage } from "../utils/multer.js"; // image-only multer (memory)

const router = express.Router();

// Submit support query (accepts optional single image under field name "image")
router.post("/submit-query", protect, uploadSingleImage("image"), SubmitSupportQuery);

// Student's own queries
router.get("/student-queries", protect, GetStudentSupportQueries);

// Admin: get all queries (protected — ensure protect checks role if needed)
router.get("/all-queries", protect, GetAllSupportQueries);

// Update status (admin)
router.put("/update-status/:queryId", protect, UpdateSupportQueryStatus);

// Add a response to a query (admin/support agent)
router.post("/:queryId/respond", protect, AddSupportQueryResponse);

export default router;
