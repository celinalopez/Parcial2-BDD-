import User from "../models/User.js";
import { verifyToken } from "../utils/jwt.js";

export const protect = async (req, res, next) => {
  try {
    const auth = req.headers.authorization || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
    if (!token) return res.status(401).json({ success: false, error: "No token provided" });

    const decoded = verifyToken(token);
    const user = await User.findById(decoded.id).select("_id role name email");
    if (!user) return res.status(401).json({ success: false, error: "Invalid token" });

    req.user = user;
    next();
  } catch (e) {
    next(e);
  }
};

export const isAdmin = (req, res, next) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ success: false, error: "Admin only" });
  }
  next();
};

export const ownerOrAdmin = (paramName = 'userId') => (req, res, next) => {
  const isOwner = String(req.user?._id) === String(req.params[paramName]);
  const isAdmin = req.user?.role === 'admin';
  if (!isOwner && !isAdmin) {
    return res.status(403).json({ success: false, error: 'Owner or admin only' });
  }
  next();
};
