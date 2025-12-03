// protect.js
import jwt from "jsonwebtoken";
import prisma from "../../prismaClient.js";

const JWT_SECRET = process.env.JWT_SECRET || "dev_fallback_jwt_secret";

export const protect = async (req, res, next) => {
  try {
    // get token from cookie or header
    let token = req.cookies?.token ?? null;
    if (!token && req.headers.authorization?.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      // 401 so frontend knows auth missing
      return res.status(401).json({ message: "Not authorized, token missing" });
    }

    // verify token
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      console.error("JWT verify failed:", err.message);
      return res.status(401).json({ message: "Token invalid or expired" });
    }

    // accept many possible id keys
    const userId =
      decoded.user_id ??
      decoded.userId ??
      decoded._id ??
      decoded.id ??
      decoded.sub; // 'sub' often used in some token generators

    if (!userId) {
      console.warn("protect: token decoded but no user id field found:", decoded);
      return res
        .status(400)
        .json({ message: "Invalid token payload: userId missing" });
    }

    // try finding user in prisma models (adjust model names to yours)
    let user = null;
    try {
      user = await prisma.student.findUnique({ where: { id: String(userId) } });
    } catch (e) {
      // continue
    }
    if (!user) {
      try {
        user = await prisma.caller.findUnique({ where: { id: String(userId) } });
      } catch (e) {}
    }
    if (!user) {
      try {
        user = await prisma.admin.findUnique({ where: { id: String(userId) } });
      } catch (e) {}
    }

    if (!user) {
      console.warn(`protect: user not found for id=${userId}`);
      return res.status(404).json({ message: "User not found" });
    }

    // attach user to req (remove sensitive fields if any)
    if (user.password) delete user.password;
    req.user = user;
    next();
  } catch (err) {
    console.error("protect middleware error:", err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
