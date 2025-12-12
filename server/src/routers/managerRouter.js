import express from "express";
import {
  DeleteSupportQuery,
  AddSupportQueryResponse,
  UpdateSupportQueryStatus,
  GetStudentSupportQueries,
  GetAllSupportQueries,
  getResultByStudentId,
  getAllResults,
  getAdmitCardById,
  getAllAdmitCards,
  getDemoClassById,
getAllDemoClasses,
getRefferedUserById,
getRefferedUsers,
getUserById,
getAllUsers
} from "../controller/managerController.js";

const router = express.Router();

// Support Query Router
router.get("/support/student-queries", GetStudentSupportQueries);
router.get("/support/all-queries", GetAllSupportQueries);
router.put("/support/update-status/:queryId", UpdateSupportQueryStatus);
router.post("/support/add-response/:queryId", AddSupportQueryResponse);
router.delete("/support/delete-query/:queryId", DeleteSupportQuery);


// Result Router 
router.get("/results/student/:studentId", getResultByStudentId);
router.get("/results", getAllResults);

// Admit Card Router
router.get("/admit-cards/:id", getAdmitCardById);
router.get("/admit-cards", getAllAdmitCards);

// Demo Class Router
router.get("/demo-classes/:id", getDemoClassById);
router.get("/demo-classes", getAllDemoClasses);

// Student Referral Router
router.get("/reffered-users/:id", getRefferedUserById);
router.get("/reffered-users", getRefferedUsers);

// User Router
router.get("/users/:id", getUserById);
router.get("/users", getAllUsers);


 

export default router;
