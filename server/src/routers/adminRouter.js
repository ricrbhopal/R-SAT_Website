import express from "express";
import {
  getAllUsers,
  deleteUser,
  putUserDetails,
  getUserById,
  getRefferedUsers,
  deleteRefferedUser,
  putRefferedUserDetails,
  getRefferedUserById,
  putDemoClassDetails,
  deleteDemoClass,
  getDemoClassById,
  getAllDemoClasses,
  AddSupportQueryResponse,
  UpdateSupportQueryStatus,
  GetStudentSupportQueries,
  GetAllSupportQueries,
  bulkCreateAdmitCards,
  getAllAdmitCards,
  getAdmitCardById,
  updateAdmitCard,
  deleteAdmitCard,
  updateAdmitCardStatus,
  bulkUpdateAdmitCards,
  getPublicAdmitCard,
  getAllResultsWithStudentDetails,
  deleteResult,
  updateResult,
  getResultByStudentId,
  getAllResults,
  createResult
} from "../controller/adminController.js";
import rateLimit from "express-rate-limit";
import {  } from "../middleware/authMiddleware.js";
const router = express.Router();

/**
 * Rate limiter for marking attendance
 * adjust windowMs / max to your needs
 */
const markLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute window
  max: 30, // max 30 requests per IP per window
  message: {
    success: false,
    message:
      "Too many attendance requests from this IP, please try again later.",
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});


// User Router
router.get("/users", getAllUsers);
router.put("/user/:id", putUserDetails);
router.get("/user/:id", getUserById);
router.delete("/user/:id", deleteUser);



// Referred User Router
router.get("/reffered-users", getRefferedUsers);
router.delete("/reffered-user/:id", deleteRefferedUser);
router.put("/reffered-user/:id", putRefferedUserDetails);
router.put("/reffered-user/:id", putRefferedUserDetails);
router.get("/reffered-user/:id", getRefferedUserById);


// Demo Class Router
router.get("/demo-classes", getAllDemoClasses);
router.get("/demo-class/:id", getDemoClassById);
router.put("/demo-class/:id", putDemoClassDetails);
router.delete("/demo-class/:id", deleteDemoClass);



// Support Query Router
router.get("/support/all-queries", GetAllSupportQueries);
router.get("/support/student-queries", GetStudentSupportQueries);
router.put("/support/update-status/:queryId", UpdateSupportQueryStatus);
router.put("/support/add-response/:queryId", AddSupportQueryResponse);


// Admit Card Router
router.post("/bulk", bulkCreateAdmitCards);
router.get("/all", getAllAdmitCards);
router.get("/:id", getAdmitCardById);
router.put("/bulk-update", bulkUpdateAdmitCards); 
router.put("/:id", updateAdmitCard); 
router.delete("/:id", deleteAdmitCard);
router.post("/:id/status", updateAdmitCardStatus); 
router.get("/admit/:idOrRsat", getPublicAdmitCard);

//Result Router
router.get("/results/all-with-student-details", getAllResultsWithStudentDetails);
router.delete("/results/:id", deleteResult);
router.put("/results/:id", updateResult);
router.get("/results/student/:studentId", getResultByStudentId);
router.get("/results/all", getAllResults);
router.post("/results/create", createResult);


export default router;
