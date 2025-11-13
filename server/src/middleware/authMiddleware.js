// middleware/authMiddleware.js
import jwt from 'jsonwebtoken';
import Student from '../models/authModel.js';

// Adjust SECRET and token source according to your generateAuthToken implementation
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_here';

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

    // decoded payload should contain user's id (adjust if your token payload uses different key)
    const userId = decoded.id || decoded._id || decoded.userId;
    if (!userId) {
      const error = new Error('Invalid token payload');
      error.statusCode = 401;
      throw error;
    }

    const student = await Student.findById(userId).select('-passwaord -__v'); // hide password
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
