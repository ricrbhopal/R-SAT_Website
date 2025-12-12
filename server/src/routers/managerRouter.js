import express from "express";
import {
  DeleteSupportQuery,
  AddSupportQueryResponse,
  UpdateSupportQueryStatus,
  GetStudentSupportQueries,
  GetAllSupportQueries,
} from "../controller/managerController.js";

const router = express.Router();

// Support Query Router
router.get("/support/student-queries", GetStudentSupportQueries);
router.get("/support/all-queries", GetAllSupportQueries);
router.put("/support/update-status/:queryId", UpdateSupportQueryStatus);
router.post("/support/add-response/:queryId", AddSupportQueryResponse);
router.delete("/support/delete-query/:queryId", DeleteSupportQuery);
export default router;
