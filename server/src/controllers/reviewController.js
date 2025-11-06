import mongoose from 'mongoose';
import Review from '../models/Review.js';
import Order from '../models/Order.js';
import Product from '../models/Product.js';

const ok = (res, data, status = 200) => res.status(status).json({ success: true, data });
const fail = (res, error, status = 400) => res.status(status).json({ success: false, error });

// Validar que el user haya comprado el product !!
const userBoughtProduct = async (userId, productId) => {
  const exists = await Order.exists({ user: userId, 'items.product': productId, status: { $ne: 'cancelled' } });
  return !!exists;
};

// Recalcular rating promedio y count de un product
const recalcProductRating = async (productId) => {
  if (!mongoose.isValidObjectId(productId)) return;
  const agg = await Review.aggregate([
    { $match: { product: new mongoose.Types.ObjectId(productId) } },
    { $group: { _id: '$product', avg: { $avg: '$rating' }, count: { $sum: 1 } } }
  ]);
  await Product.findByIdAndUpdate(productId, {
    $set: {
      avgRating: Math.round((agg[0]?.avg ?? 0) * 100) / 100,
      ratingsCount: agg[0]?.count ?? 0
    }
  });
};

// GET /api/reviews todas con datos de user y product
export const listAllReviews = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const items = await Review.find()
      .populate('user', 'name email')
      .populate('product', 'name brand')
      .sort({ createdAt: -1 })
      .skip(skip).limit(Number(limit));

    const total = await Review.countDocuments();
    ok(res, { items, page: Number(page), limit: Number(limit), total });
  } catch (e) { next(e); }
};

// GET /api/reviews/product/:productId  
export const listReviewsByProduct = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const items = await Review.find({ product: req.params.productId })
      .populate('user', 'name')
      .sort({ createdAt: -1 })
      .skip(skip).limit(Number(limit));
    const total = await Review.countDocuments({ product: req.params.productId });
    ok(res, { items, page: Number(page), limit: Number(limit), total });
  } catch (e) { next(e); }
};

// GET /api/reviews/top  promedio por producto 
export const topProductsByReviews = async (req, res, next) => {
  try {
    const limit = Number(req.query.limit) || 5;
    const pipeline = [
      { $lookup: { from: 'reviews', localField: '_id', foreignField: 'product', as: 'rv' } },
      { $addFields: { ratingsCount: { $size: '$rv' }, avgRating: { $cond: [{ $gt: [{ $size: '$rv' }, 0] }, { $avg: '$rv.rating' }, 0] } } },
      { $sort: { avgRating: -1, ratingsCount: -1 } },
      { $limit: limit },
      { $project: { name: 1, brand: 1, ratingsCount: 1, avgRating: { $round: ['$avgRating', 2] } } }
    ];
    ok(res, await Product.aggregate(pipeline));
  } catch (e) { next(e); }
};

// POST /api/reviews  SOLO SI COMPRO
export const createReview = async (req, res, next) => {
  try {
    const { product, rating, comment } = req.body;
    if (!product || !rating) return fail(res, 'product y rating son requeridos', 400);

    const allowed = await userBoughtProduct(req.user._id, product);
    if (!allowed) return fail(res, 'Solo pueden reviewr quienes compraron este product', 403);

    const rv = await Review.create({ user: req.user._id, product, rating, comment });
    await recalcProductRating(product);

    const populated = await Review.findById(rv._id).populate('user', 'name').populate('product', 'name');
    ok(res, populated, 201);
  } catch (e) {
    if (e?.code === 11000) return fail(res, 'Ya existe una review tuya para este product', 409);
    next(e);
  }
};

// PATCH /api/reviews/:id USO DE $SET
export const updateReview = async (req, res, next) => {
  try {
    const rv = await Review.findById(req.params.id);
    if (!rv) return fail(res, 'Reseña no encontrada', 404);
    if (String(rv.user) !== String(req.user._id) && req.user.role !== 'admin') return fail(res, 'Solo el autor o admin', 403);

    if ('rating' in req.body) rv.rating = req.body.rating;
    if ('comment' in req.body) rv.comment = req.body.comment;
    await rv.save();
    await recalcProductRating(rv.product);

    const populated = await Review.findById(rv._id).populate('user', 'name').populate('product', 'name');
    ok(res, populated);
  } catch (e) { next(e); }
};

// DELETE /api/reviews/:id 
export const deleteReview = async (req, res, next) => {
  try {
    const rv = await Review.findById(req.params.id);
    if (!rv) return fail(res, 'Reseña no encontrada', 404);
    if (String(rv.user) !== String(req.user._id) && req.user.role !== 'admin') return fail(res, 'Solo el autor o admin', 403);

    await Review.findByIdAndDelete(rv._id);
    await recalcProductRating(rv.product);
    ok(res, { id: rv._id });
  } catch (e) { next(e); }
};
