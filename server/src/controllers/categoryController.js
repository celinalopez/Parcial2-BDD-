import Category from '../models/Category.js';
import Product from '../models/Product.js';

const ok = (res, data, status = 200) => res.status(status).json({ success: true, data });
const fail = (res, error, status = 400) => res.status(status).json({ success: false, error });

export const createCategory = async (req, res, next) => {
  try {
    const { name, description } = req.body;
    if (!name) return fail(res, 'name requerido', 400);
    const cat = await Category.create({ name, description });
    ok(res, cat, 201);
  } catch (e) { next(e); }
};

export const listCategories = async (_req, res, next) => {
  try {
    const cats = await Category.find().sort({ name: 1 });
    ok(res, cats);
  } catch (e) { next(e); }
};

export const getCategory = async (req, res, next) => {
  try {
    const cat = await Category.findById(req.params.id);
    if (!cat) return fail(res, 'Categoria no encontrada', 404);
    ok(res, cat);
  } catch (e) { next(e); }
};

export const updateCategory = async (req, res, next) => {
  try {
    const { name, description } = req.body;
    const cat = await Category.findByIdAndUpdate(
      req.params.id,
      { ...(name && { name }), ...(description && { description }) },
      { new: true, runValidators: true }
    );
    if (!cat) return fail(res, 'Categoria no encontrada', 404);
    ok(res, cat);
  } catch (e) { next(e); }
};

export const deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const count = await Product.countDocuments({ category: id });
    if (count > 0) return fail(res, 'No se puede eliminar: hay productos asociados', 409);

    await Category.findByIdAndDelete(id);
    ok(res, { id });
  } catch (e) { next(e); }
};

// AGREGACION cantidad de productos por categoria
export const statsProductsByCategory = async (_req, res, next) => {
  try {
    const pipeline = [
      { $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: 'category',
          as: 'products'
      }},
      { $project: { name: 1, productsCount: { $size: '$products' } } },
      { $sort: { productsCount: -1, name: 1 } }
    ];
    const stats = await Category.aggregate(pipeline);
    ok(res, stats);
  } catch (e) { next(e); }
};
