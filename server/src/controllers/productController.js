import mongoose from 'mongoose';
import Product from '../models/Product.js';
import Category from '../models/Category.js';
import Review from '../models/Review.js';

const ok = (res, data, status = 200) => res.status(status).json({ success: true, data });
const fail = (res, error, status = 400) => res.status(status).json({ success: false, error });

// GET /api/products  listar con categorIa USO DE $LOOKUP 
export const listProducts = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const pipeline = [
      { $lookup: { from: 'categories', localField: 'category', foreignField: '_id', as: 'category' } },
      { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
      { $sort: { createdAt: -1 } },
      { $skip: skip }, { $limit: Number(limit) }
    ];
    const [items, total] = await Promise.all([
      Product.aggregate(pipeline),
      Product.countDocuments()
    ]);
    ok(res, { items, page: Number(page), limit: Number(limit), total });
  } catch (e) { next(e); }
};

// GET /api/products/filtro
// Filtros por marca y rango de precio
// USO DE $NE PARA EXCLUIR UNA MARCA 

export const filterProducts = async (req, res, next) => {
  try {
    const { brand, excludeBrand, minPrice, maxPrice } = req.query;

    const and = [];
    if (brand) and.push({ brand: { $eq: brand } });
    if (excludeBrand) and.push({ brand: { $ne: excludeBrand } });
    if (minPrice || maxPrice) and.push({
      price: {
        ...(minPrice ? { $gte: Number(minPrice) } : {}),
        ...(maxPrice ? { $lte: Number(maxPrice) } : {})
      }
    });

    const filter = and.length ? { $and: and } : {};
    const items = await Product.find(filter).populate('category', 'name');
    ok(res, items);
  } catch (e) { next(e); }
};

// GET /api/products/top  más reseñados y mejor rating 
export const topProducts = async (req, res, next) => {
  try {
    const limit = Number(req.query.limit) || 5;
    const pipeline = [
      { $lookup: { from: 'reviews', localField: '_id', foreignField: 'product', as: 'reviews' } },
      { $addFields: {
          ratingsCount: { $size: '$reviews' },
          avgRating: { $cond: [{ $gt: [{ $size: '$reviews' }, 0] }, { $avg: '$reviews.rating' }, 0] }
      }},
      { $sort: { ratingsCount: -1, avgRating: -1, createdAt: -1 } },
      { $limit: limit },
      { $project: { name: 1, brand: 1, ratingsCount: 1, avgRating: { $round: ['$avgRating', 2] } } }
    ];
    const top = await Product.aggregate(pipeline);
    ok(res, top);
  } catch (e) { next(e); }
};

// POST /api/products crear producto
export const createProduct = async (req, res, next) => {
  try { ok(res, await Product.create(req.body), 201); } catch (e) { next(e); }
};

// GET /api/products/:id  obtener producto por ID
export const getProduct = async (req, res, next) => {
  try {
    const p = await Product.findById(req.params.id).populate('category', 'name');
    if (!p) return fail(res, 'Producto no encontrado', 404);
    ok(res, p);
  } catch (e) { next(e); }
};

// PATCH /api/products/:id USO DE $SET 
export const updateProduct = async (req, res, next) => {
  try {
    const p = await Product.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true, runValidators: true });
    if (!p) return fail(res, 'Producto no encontrado', 404);
    ok(res, p);
  } catch (e) { next(e); }
};

// DELETE /api/products/:id 
export const deleteProduct = async (req, res, next) => {
  try {
    const p = await Product.findByIdAndDelete(req.params.id);
    if (!p) return fail(res, 'Producto no encontrado', 404);
    ok(res, { id: p._id });
  } catch (e) { next(e); }
};

// PATCH /api/products/:id/stock actualizar stock con delta o valor absoluto
export const patchStock = async (req, res, next) => {
  try {
    const { delta, stock } = req.body;
    if (Number.isInteger(delta)) {
      const p = await Product.findOneAndUpdate(
        { _id: req.params.id, stock: { $gte: delta < 0 ? -delta : 0 } },
        { $inc: { stock: delta } },
        { new: true }
      );
      if (!p) return fail(res, 'Stock insuficiente o product no encontrado', 409);
      return ok(res, p);
    }
    if (Number.isInteger(stock)) {
      const p = await Product.findByIdAndUpdate(req.params.id, { $set: { stock } }, { new: true });
      if (!p) return fail(res, 'Producto no encontrado', 404);
      return ok(res, p);
    }
    return fail(res, 'Body debe incluir "delta" o "stock"', 400);
  } catch (e) { next(e); }
};
