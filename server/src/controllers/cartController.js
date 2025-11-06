import mongoose from 'mongoose';
import Cart from '../models/Cart.js';
import Product from '../models/Product.js';
import { ok, fail } from '../utils/response.js';

// Asegura que el usuario tenga un carrito, si no lo tiene lo crea
const ensureCart = async (userId) => {
  let cart = await Cart.findOne({ user: userId });
  if (!cart) cart = await Cart.create({ user: userId, items: [] });
  return cart;
};

// GET /api/cart/:userId con productos
export const getCart = async (req, res, next) => {
  try {
    const user = req.params.userId;
    const cart = await ensureCart(user);
    await cart.populate('items.product', 'name brand price stock');
    ok(res, cart);
  } catch (e) { next(e); }
};

// POST /api/cart/:userId/items  agregar o incrementar 
export const addItem = async (req, res, next) => {
  try {
    const { productId, qty } = req.body;
    const product = await Product.findById(productId);
    if (!product) return fail(res, 'Producto no encontrado', 404);
    if (qty <= 0) return fail(res, 'qty > 0', 400);

    const cart = await ensureCart(req.params.userId);
    const idx = cart.items.findIndex(i => String(i.product) === String(productId));
    if (idx >= 0) cart.items[idx].qty += qty;
    else cart.items.push({ product: productId, qty, priceAtAdd: product.price });

    await cart.save();
    await cart.populate('items.product', 'name brand price stock');
    ok(res, cart, 201);
  } catch (e) { next(e); }
};

// PATCH /api/cart/:userId/items/:productId  actualiza cantidad o elimina si qty<=0
export const updateItemQty = async (req, res, next) => {
  try {
    const { qty } = req.body;
    const cart = await ensureCart(req.params.userId);
    const idx = cart.items.findIndex(i => String(i.product) === String(req.params.productId));
    if (idx < 0) return fail(res, 'Item no está en el cart', 404);

    if (qty <= 0) cart.items.splice(idx, 1);
    else cart.items[idx].qty = qty;

    await cart.save();
    await cart.populate('items.product', 'name brand price stock');
    ok(res, cart);
  } catch (e) { next(e); }
};

// DELETE /api/cart/:userId/items/:productId 
export const removeItem = async (req, res, next) => {
  try {
    const cart = await ensureCart(req.params.userId);
    cart.items = cart.items.filter(i => String(i.product) !== String(req.params.productId));
    await cart.save();
    ok(res, cart);
  } catch (e) { next(e); }
};

// DELETE /api/cart/:userId  vaciar el carrito
export const clearCart = async (req, res, next) => {
  try {
    await Cart.updateOne({ user: req.params.userId }, { $set: { items: [] } });
    ok(res, { emptied: true });
  } catch (e) { next(e); }
};

// GET /api/cart/:userId/total  subtotal y total con agregacion 
export const getCartTotals = async (req, res, next) => {
  try {
    const user = new mongoose.Types.ObjectId(req.params.userId);

    const pipeline = [
      { $match: { user } },
      { $unwind: '$items' },
      { $lookup: { from: 'products', localField: 'items.product', foreignField: '_id', as: 'p' } },
      { $unwind: '$p' },
      { $project: {
          qty: '$items.qty',
          price: { $ifNull: ['$items.priceAtAdd', '$p.price'] },
          subtotal: { $multiply: ['$items.qty', { $ifNull: ['$items.priceAtAdd', '$p.price'] }] }
      }},
      { $group: { _id: null, itemsCount: { $sum: '$qty' }, subtotal: { $sum: '$subtotal' } } }
    ];

    const rows = await Cart.aggregate(pipeline);
    const totals = rows[0] || { itemsCount: 0, subtotal: 0 };
    ok(res, totals);
  } catch (e) { next(e); }
};
