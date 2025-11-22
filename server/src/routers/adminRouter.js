import express from "express";
import { getAllUsers , deleteUser,putUserDetails, getUserById,getRefferedUsers ,
    deleteRefferedUser,putRefferedUserDetails,
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
  bulkUpdateAdmitCards

} from "../controller/adminController.js";

const router = express.Router();

// GET /admin/users -> Get all users (admin only)
router.get("/users", getAllUsers);
// PUT /admin/user/:id -> Update user details (admin only)
router.put("/user/:id", putUserDetails);
// GET /admin/user/:id -> Get user by ID (admin only)
router.get("/user/:id", getUserById);
// DELETE /admin/user/:id -> Delete a user (admin only)
router.delete("/user/:id", deleteUser);
// GET /admin/reffered-users -> Get all referred users (admin only)
router.get("/reffered-users", getRefferedUsers);
// DELETE /admin/reffered-user/:id -> Delete a referred user (admin only)
router.delete("/reffered-user/:id", deleteRefferedUser);
// PUT /admin/reffered-user/:id -> Update referred user details (admin only)
router.put("/reffered-user/:id", putRefferedUserDetails);
// GET /admin/reffered-user/:id -> Get referred user by ID (admin only)
router.get("/reffered-user/:id", getRefferedUserById);
// GET /admin/demo-classes -> Get all demo classes (admin only)
router.get("/demo-classes", getAllDemoClasses);
// GET /admin/demo-class/:id -> Get demo class by ID (admin only)
router.get("/demo-class/:id", getDemoClassById);
// PUT /admin/demo-class/:id -> Update demo class details (admin only)
router.put("/demo-class/:id", putDemoClassDetails);
// DELETE /admin/demo-class/:id -> Delete a demo class (admin only)
router.delete("/demo-class/:id", deleteDemoClass);
// GET /admin/support/all-queries -> Get all support queries (admin only)
router.get("/support/all-queries", GetAllSupportQueries);
// GET /admin/support/student-queries -> Get support queries for logged-in student
router.get("/support/student-queries", GetStudentSupportQueries);
// PUT /admin/support/update-status/:queryId -> Update support query status (admin only)
router.put("/support/update-status/:queryId", UpdateSupportQueryStatus);
// PUT /admin/support/add-response/:queryId -> Add response to support query (admin only)
router.put("/support/add-response/:queryId", AddSupportQueryResponse);


router.post("/bulk", bulkCreateAdmitCards);
router.get("/all", getAllAdmitCards);
router.get("/:id", getAdmitCardById);
router.put("/bulk-update", bulkUpdateAdmitCards); // Bulk update admit cards
router.put("/:id", updateAdmitCard); // Update a single admit card
router.delete("/:id", deleteAdmitCard);
router.post("/:id/status", updateAdmitCardStatus); // change status (issue)
export default router;
