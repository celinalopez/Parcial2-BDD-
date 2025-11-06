import mongoose from 'mongoose';

export const validateObjectIdParam = (paramName) => (req, res, next) => {
  const id = req.params[paramName];
  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ success: false, error: `Invalid ObjectId for param "${paramName}"` });
  }
  next();
};
