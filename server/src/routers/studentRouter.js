// routes/studentRoutes.js
import express from 'express';
import {
  SendOTP,
  Register,
  SendCredentials,
  Login,

  getStudentProfile

} from "../controller/studentController.js";

import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes
// POST /api/students/send-otp
router.post('/send-otp', SendOTP);

// POST /api/students/register
router.post('/register', Register);

// POST /api/students/send-credentials
router.post('/send-credentials', SendCredentials);

// POST /api/students/login
router.post('/login', Login);


//get student profile (protected)
router.get('/profile', protect, getStudentProfile);


export default router;
