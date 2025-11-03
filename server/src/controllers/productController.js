import Product from '../models/Product.js';
import Category from '../models/Category.js';
import Review from '../models/Review.js';

const ok = (res, data, status = 200) => res.status(status).json({ success: true, data });
const fail = (res, error, status = 400) => res.status(status).json({ success: false, error });

export const createProduct = async (req, res, next) => {
  try {
    const { name, description, brand, category, price, stock } = req.body;
    if (!name || !category || price == null) return fail(res, 'name, category y price son requeridos', 400);
    const cat = await Category.findById(category);
    if (!cat) return fail(res, 'Categoría inválida', 400);
    const p = await Product.create({ name, description, brand, category, price, stock });
    ok(res, p, 201);
  } catch (e) { next(e); }
};

// Listar con filtros: ?q=&brand=&minPrice=&maxPrice=&category=
export const listProducts = async (req, res, next) => {
  try {
    const { q, brand, minPrice, maxPrice, category, page = 1, limit = 10 } = req.query;
    const filter = {};
    if (q) filter.name = { $regex: q, $options: 'i' };
    if (brand) filter.brand = { $regex: brand, $options: 'i' };
    if (category) filter.category = category;
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [items, total] = await Promise.all([
      Product.find(filter).populate('category', 'name').sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      Product.countDocuments(filter)
    ]);
    ok(res, { items, page: Number(page), limit: Number(limit), total });
  } catch (e) { next(e); }
};

export const getProduct = async (req, res, next) => {
  try {
    const p = await Product.findById(req.params.id).populate('category', 'name');
    if (!p) return fail(res, 'Producto no encontrado', 404);
    ok(res, p);
  } catch (e) { next(e); }
};

export const updateProduct = async (req, res, next) => {
  try {
    const allowed = ['name','description','brand','category','price','stock'];
    const updates = {};
    for (const k of allowed) if (k in req.body) updates[k] = req.body[k];

    if (updates.category) {
      const cat = await Category.findById(updates.category);
      if (!cat) return fail(res, 'Categoría inválida', 400);
    }

    const p = await Product.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    if (!p) return fail(res, 'Producto no encontrado', 404);
    ok(res, p);
  } catch (e) { next(e); }
};

export const deleteProduct = async (req, res, next) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    ok(res, { id: req.params.id });
  } catch (e) { next(e); }
};

// PATCH stock: /api/productos/:id/stock  { "delta": -3 }  o  { "stock": 20 }
export const patchStock = async (req, res, next) => {
  try {
    const { delta, stock } = req.body;
    let update = {};
    if (typeof delta === 'number') update = { $inc: { stock: delta } };
    if (typeof stock === 'number') update = { $set: { stock } };
    if (!Object.keys(update).length) return fail(res, 'Enviar delta o stock', 400);

    const p = await Product.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!p) return fail(res, 'Producto no encontrado', 404);
    ok(res, p);
  } catch (e) { next(e); }
};

// TOP más reseñados / mejor puntuados: ?limit=5
export const topReviewed = async (req, res, next) => {
  try {
    const limit = Number(req.query.limit) || 5;
    const pipeline = [
      { $lookup: { from: 'reviews', localField: '_id', foreignField: 'product', as: 'reviews' } },
      { $addFields: {
          ratingsCount: { $size: '$reviews' },
          avgRating: { $cond: [
            { $gt: [ { $size: '$reviews' }, 0 ] },
            { $avg: '$reviews.rating' },
            0
          ]}
      }},
      { $sort: { ratingsCount: -1, avgRating: -1, createdAt: -1 } },
      { $limit: limit },
      { $project: { name: 1, brand: 1, price: 1, ratingsCount: 1, avgRating: { $round: ['$avgRating', 2] } } }
    ];
    const top = await Product.aggregate(pipeline);
    ok(res, top);
  } catch (e) { next(e); }
};
