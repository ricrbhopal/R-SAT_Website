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
import { uploadSingleImage } from "../utils/multer.js"; 

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
// Delete support query (admin)
router.delete("/delete-query/:queryId", protect, async (req, res, next) => {
  // Use controller if you want, but for now inline for clarity
  try {
    const { queryId } = req.params;
    if (!queryId) return res.status(400).json({ message: "Query ID required" });
    const deleted = await import("../controller/supportController.js").then(mod => mod.DeleteSupportQuery(req, res, next));
    return deleted;
  } catch (err) {
    next(err);
  }
});

export default router;
