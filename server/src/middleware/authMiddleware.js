import jwt from "jsonwebtoken";
import Student from "../models/authModel.js";
import Admin from "../models/adminAuth.js"; // change path if needed

// -------------------------
// JWT SECRET
// -------------------------
let JWT_SECRET = process.env.JWT_SECRET || "dev_secret_fallback";
if (!process.env.JWT_SECRET) {
  console.warn("⚠ JWT_SECRET not found! Using fallback secret.");
}

// -------------------------
// PROTECT (Authentication)
// -------------------------
export const protect = async (req, res, next) => {
  try {
    let token = null;

    // 1) Token from Cookie
    if (req.cookies?.token) {
      token = req.cookies.token;
    }

    // 2) Token from Authorization Header
    if (!token && req.headers.authorization?.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }

    // 3) No token found
    if (!token) {
      return res.status(401).json({ message: "Not authorized — token missing" });
    }

    // 4) Verify Token
    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = decoded.user_id || decoded.id || decoded._id;

    if (!userId)
      return res.status(401).json({ message: "Invalid token payload" });

    // -------------------------
    // 5) Identify User Type
    // -------------------------
    let user = null;

    // Try Admin
    user = await Admin.findById(userId).select("-password -__v");
    if (!user) {
      // Try Student
      user = await Student.findById(userId).select("-password -__v");
    }

    if (!user)
      return res.status(401).json({ message: "User not found for this token" });

    // 6) Attach User Object
    req.user = user;
    next();
  } catch (err) {
    console.error("Auth Error:", err);
    return res.status(401).json({ message: "Not authorized — Invalid token" });
  }
};

// -------------------------
// requireRole([...roles])
// -------------------------
export const requireRole = (roles = []) => {
  return (req, res, next) => {
    if (!req.user)
      return res.status(401).json({ message: "Not authenticated" });

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Access denied — ${roles.join(", ")} only`,
      });
    }

    next();
  };
};

// -------------------------
// isAdmin => Shortcut Middleware
// -------------------------
export const isAdmin = (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: "Not authenticated" });

  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin access only" });
  }

  next();
};
