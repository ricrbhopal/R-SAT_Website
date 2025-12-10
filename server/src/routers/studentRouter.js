// routes/studentRoutes.js
import express from 'express';
import {
  SendOTP,
  Register,
  SendCredentials,
  Login,

  getStudentProfile,
  GetDemoSlots,
   BookDemoSlot,
     SubmitSupportQuery,
     GetStudentSupportQueries,
     GetAllSupportQueries,
     UpdateSupportQueryStatus,
     AddSupportQueryResponse,
       createReferral,
       getReferralInfo,
       registerWithReferral,
       sendReferralOTP

} from "../controller/studentController.js";

import { protect } from '../middleware/authMiddleware.js';
import { uploadSingleImage } from "../utils/multer.js"; 

const router = express.Router();


router.post('/send-otp', SendOTP);


router.post('/register', (req, res, next) => {
  try {
    if (req.query && (req.query.userId || req.query.ref || req.query.code)) {
      return registerWithReferral(req, res, next);
    }
    return Register(req, res, next);
  } catch (err) {
    next(err);
  }
});

// POST /api/students/send-credentials
router.post('/send-credentials', SendCredentials);

// POST /api/students/login
router.post('/login', Login);


//get student profile (protected)
router.get('/profile', protect, getStudentProfile);


// POST /solt/registerSlot -> verify OTPs and book slot
router.post("/registerSlot", BookDemoSlot);
// GET /solt/getAllSlots
router.get("/getAllSlots", GetDemoSlots);





// Submit support query (accepts optional single image under field name "image")
router.post("/submit-query", protect, uploadSingleImage("image"), SubmitSupportQuery);

// Student's own queries
router.get("/student-queries", protect, GetStudentSupportQueries);

// Admin: get all queries (protected — ensure protect checks role if needed)
router.get("/all-queries", protect, GetAllSupportQueries);

// Update status (admin)
router.put("/update-status/:queryId", protect, UpdateSupportQueryStatus);

// Add a response to a query (admin/support agent)
router.post("/add-response/:queryId", protect, AddSupportQueryResponse);
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





// send referral OTP (public)
router.post("/send-otp", sendReferralOTP);

// create referral (authenticated)
router.post("/create", protect, createReferral);

// get referral info (public)
router.get("/info/:code", getReferralInfo);

// (old direct registration mapping removed - handled above)

export default router;
