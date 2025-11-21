import express from "express";
import { getAllUsers , deleteUser,putUserDetails, getUserById,getRefferedUsers ,deleteRefferedUser,putRefferedUserDetails,getRefferedUserById} from "../controller/adminController.js";

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
export default router;
