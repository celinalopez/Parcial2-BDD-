import Category from '../models/Category.js';
import { ok, fail } from '../utils/response.js';

// CRUD 
export const listCategories = async (_req, res, next) => { try { ok(res, await Category.find().sort({ name: 1 })); } catch (e) { next(e); } };
export const createCategory = async (req, res, next) => { try { ok(res, await Category.create(req.body), 201); } catch (e) { next(e); } };
export const getCategory = async (req, res, next) => { try {
  const c = await Category.findById(req.params.id);
  if (!c) return fail(res, 'Categoría no encontrada', 404);
  ok(res, c);
} catch (e) { next(e); } };
export const updateCategory = async (req, res, next) => { try {
  const c = await Category.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true, runValidators: true });
  if (!c) return fail(res, 'Categoría no encontrada', 404);
  ok(res, c);
} catch (e) { next(e); } };
export const deleteCategory = async (req, res, next) => { try {
  const c = await Category.findByIdAndDelete(req.params.id);
  if (!c) return fail(res, 'Categoría no encontrada', 404);
  ok(res, { id: c._id });
} catch (e) { next(e); } };

// GET /api/categories/stats  cantidad de productos por categoria
export const categoryStats = async (_req, res, next) => {
  try {
    const pipeline = [
      { $lookup: { from: 'products', localField: '_id', foreignField: 'category', as: 'products' } },
      { $project: { name: 1, qty: { $size: '$products' } } },
      { $sort: { qty: -1, name: 1 } }
    ];
    const stats = await Category.aggregate(pipeline);
    ok(res, stats);
  } catch (e) { next(e); }
};
