// routes/studentRoutes.js
import express from 'express';
import {
  SendOTP,
  Register,
  SendCredentials,
  Login,
  Logout,
//   refreshData
} from '../controller/authjController.js';

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

// POST /api/students/logout
router.post('/logout', Logout);

// Protected route - requires auth
// GET /api/students/refresh
// router.get('/refresh', protect, refreshData);

export default router;
