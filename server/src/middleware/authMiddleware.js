// middleware/authMiddleware.js
import jwt from 'jsonwebtoken';
import Student from '../models/authModel.js';

// Use JWT secret from env. If missing, log a warning so devs notice.
let JWT_SECRET = process.env.JWT_SECRET||'kjkjk4jkl45klkl1@23423hjkhjkbgui@2@3';
if (!JWT_SECRET) {
  // Provide a development fallback so local dev doesn't return 500.
  // WARNING: This should NOT be used in production. Set JWT_SECRET in your .env.
  JWT_SECRET = 'dev_fallback_jwt_secret';
  console.warn('Warning: JWT_SECRET is not set. Using development fallback secret. Set JWT_SECRET in .env for production.');
}

export const protect = async (req, res, next) => {
  try {
    // 1) Try to read token from cookie first
    let token = null;
    if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    // 2) fallback: Authorization header (Bearer <token>)
    if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      const error = new Error('Not authorized, token missing');
      error.statusCode = 401;
      throw error;
    }

    // verify token
    const decoded = jwt.verify(token, JWT_SECRET);

    // decoded payload should contain user's id - our token uses `user_id`
    const userId = decoded.user_id || decoded.userId || decoded._id || decoded.id;
    if (!userId) {
      const error = new Error('Invalid token payload');
      error.statusCode = 401;
      throw error;
    }
    const student = await Student.findById(userId).select('-password -__v');
    if (!student) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }

    // attach to req.user
    req.user = student;
    next();
  } catch (err) {
    next(err);
  }
};
