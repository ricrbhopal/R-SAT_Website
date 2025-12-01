import jwt from 'jsonwebtoken';
import Student from '../models/authModel.js';
import Caller from '../models/callerModel.js';
import AdminAuth from '../models/adminAuth.js';

let JWT_SECRET = process.env.JWT_SECRET || 'kjkjk4jkl45klkl1@23423hjkhjkbgui@2@3';
if (!JWT_SECRET) {
  JWT_SECRET = 'dev_fallback_jwt_secret';
  console.warn('Warning: JWT_SECRET is not set. Using development fallback secret. Set JWT_SECRET in .env for production.');
}

export const protect = async (req, res, next) => {
  try {
    let token = null;
    if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }
    if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (!token) {
      const error = new Error('Not authorized, token missing');
      error.statusCode = 401;
      throw error;
    }
    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = decoded.user_id || decoded.userId || decoded._id || decoded.id;
    if (!userId) {
      const error = new Error('Invalid token payload');
      error.statusCode = 401;
      throw error;
    }
    let user = await Student.findById(userId).select('-password -__v');
    if (!user) user = await Caller.findById(userId).select('-password -__v');
    if (!user) user = await AdminAuth.findById(userId).select('-password -__v');
    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }
    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
};