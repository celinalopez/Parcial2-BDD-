import mongoose from 'mongoose';
import Review from '../models/Review.js';
import Order from '../models/Order.js';
import Product from '../models/Product.js';

const ok = (res, data, status=200) => res.status(status).json({ success: true, data });
const fail = (res, error, status=400) => res.status(status).json({ success: false, error });

/** Recalcula y guarda avgRating y ratingsCount en Product */
const recomputeProductRating = async (productId) => {
  if (!mongoose.isValidObjectId(productId)) {
    // si llega algo raro, no rompas la request principal
    return;
  }

  const agg = await Review.aggregate([
    { $match: { product: new mongoose.Types.ObjectId(productId) } },
    { $group: { _id: '$product', avg: { $avg: '$rating' }, count: { $sum: 1 } } }
  ]);

  const avg = agg[0]?.avg ?? 0;
  const count = agg[0]?.count ?? 0;

  await Product.findByIdAndUpdate(productId, {
    $set: {
      avgRating: Math.round(avg * 100) / 100,
      ratingsCount: count
    }
  });
};



/** Valida que el usuario haya comprado el producto alguna vez (orden no cancelada) */
const userBoughtProduct = async (userId, productId) => {
  const exists = await Order.exists({
    user: userId,
    'items.product': productId,
    status: { $ne: 'cancelled' }
  });
  return !!exists;
};

/** POST /api/resenas  body: { product, rating, comment } */
export const createReview = async (req, res, next) => {
  try {
    const { product, rating, comment } = req.body;
    if (!product || !rating) return fail(res, 'product y rating son requeridos', 400);

    // solo reseña quien compró
    const allowed = await userBoughtProduct(req.user._id, product);
    if (!allowed) return fail(res, 'Solo pueden reseñar quienes compraron este producto', 403);

    const rv = await Review.create({ user: req.user._id, product, rating, comment });
    await recomputeProductRating(product);

    const populated = await Review.findById(rv._id)
      .populate('user', 'name')
      .populate('product', 'name brand');

    ok(res, populated, 201);
  } catch (e) {
    // si choca con índice único (ya reseñó), mandamos mensaje claro
    if (e?.code === 11000) return fail(res, 'Ya existe una reseña tuya para este producto', 409);
    next(e);
  }
};

/** PATCH /api/resenas/:id  (owner) */
export const updateReview = async (req, res, next) => {
  try {
    const rv = await Review.findById(req.params.id);
    if (!rv) return fail(res, 'Reseña no encontrada', 404);
    if (String(rv.user) !== String(req.user._id) && req.user.role !== 'admin')
      return fail(res, 'Solo el autor o admin', 403);

    if ('rating' in req.body) rv.rating = req.body.rating;
    if ('comment' in req.body) rv.comment = req.body.comment;
    await rv.save();
    await recomputeProductRating(rv.product);

    const populated = await Review.findById(rv._id)
      .populate('user', 'name')
      .populate('product', 'name brand');
    ok(res, populated);
  } catch (e) { next(e); }
};

/** DELETE /api/resenas/:id  (owner o admin) */
export const deleteReview = async (req, res, next) => {
  try {
    const rv = await Review.findById(req.params.id);
    if (!rv) return fail(res, 'Reseña no encontrada', 404);
    if (String(rv.user) !== String(req.user._id) && req.user.role !== 'admin')
      return fail(res, 'Solo el autor o admin', 403);

    await Review.findByIdAndDelete(rv._id);
    await recomputeProductRating(rv.product);
    ok(res, { id: rv._id });
  } catch (e) { next(e); }
};

/** GET /api/resenas/product/:productId  (público) */
export const listReviewsByProduct = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [items, total] = await Promise.all([
      Review.find({ product: productId })
        .populate('user', 'name')
        .sort({ createdAt: -1 })
        .skip(skip).limit(Number(limit)),
      Review.countDocuments({ product: productId })
    ]);

    ok(res, { items, page: Number(page), limit: Number(limit), total });
  } catch (e) { next(e); }
};

/** GET /api/resenas/me/product/:productId  (owner) => trae mi reseña si existe */
export const getMyReviewForProduct = async (req, res, next) => {
  try {
    const rv = await Review.findOne({ product: req.params.productId, user: req.user._id });
    ok(res, rv || null);
  } catch (e) { next(e); }
};

/** GET /api/resenas/top?limit=5
 *  TOP productos por promedio y cantidad de reseñas (agregaciones)
 */
export const topProductsByReviews = async (req, res, next) => {
  try {
    const limit = Number(req.query.limit) || 5;
    const pipeline = [
      { $lookup: { from: 'reviews', localField: '_id', foreignField: 'product', as: 'reviews' } },
      { $addFields: {
          ratingsCount: { $size: '$reviews' },
          avgRating: {
            $cond: [{ $gt: [{ $size: '$reviews' }, 0] }, { $avg: '$reviews.rating' }, 0]
          }
      }},
      { $sort: { avgRating: -1, ratingsCount: -1, createdAt: -1 } },
      { $limit: limit },
      { $project: { name: 1, brand: 1, ratingsCount: 1, avgRating: { $round: ['$avgRating', 2] } } }
    ];
    const top = await Product.aggregate(pipeline);
    ok(res, top);
  } catch (e) { next(e); }
};
