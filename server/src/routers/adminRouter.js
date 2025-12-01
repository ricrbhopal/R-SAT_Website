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
  createResult,
  DeleteSupportQuery,
getAdminProfileById,
  logoutAdmin,
  loginAdmin,
  registerAdmin,
  verifyAdminOtp,
  sendAdminOtp

} from "../controller/adminController.js";
const router = express.Router();

router.post("/login", loginAdmin);

router.get("/profile/:id", getAdminProfileById);

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
router.delete("/support/delete-query/:queryId", DeleteSupportQuery);

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

// Admin Auth Router
router.post("/register", registerAdmin);
router.post("/verify-otp", verifyAdminOtp);
router.post("/logout", logoutAdmin);
router.post("/send-otp", sendAdminOtp);
export default router;
