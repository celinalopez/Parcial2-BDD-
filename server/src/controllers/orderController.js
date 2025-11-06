import mongoose from 'mongoose';
import Order from '../models/Order.js';
import Cart from '../models/Cart.js';
import Product from '../models/Product.js';

const ok = (res, data, status = 200) => res.status(status).json({ success: true, data });
const fail = (res, error, status = 400) => res.status(status).json({ success: false, error });

// POST /api/orders  crear desde carrito  
export const createOrderFromCart = async (req, res, next) => {
  try {
    const userId = req.body.userId || String(req.user._id);
    const { paymentMethod } = req.body;

    const cart = await Cart.findOne({ user: userId });
    if (!cart || cart.items.length === 0) return fail(res, 'Carrito vacío', 409);

    // validar stock y preparar items
    const ids = cart.items.map(i => i.product);
    const products = await Product.find({ _id: { $in: ids } });

    const items = [];
    const bulk = [];
    for (const ci of cart.items) {
      const p = products.find(x => String(x._id) === String(ci.product));
      if (!p) return fail(res, `Producto inexistente: ${ci.product}`, 409);
      if (p.stock < ci.qty) return fail(res, `Stock insuficiente de ${p.name}`, 409);

      items.push({ product: ci.product, qty: ci.qty, price: ci.priceAtAdd ?? p.price, subtotal: (ci.priceAtAdd ?? p.price) * ci.qty });
      bulk.push({ updateOne: { filter: { _id: p._id, stock: { $gte: ci.qty } }, update: { $inc: { stock: -ci.qty } } } }); // evita negativos
    }

    if (bulk.length) await Product.bulkWrite(bulk);
    const total = items.reduce((a, it) => a + it.subtotal, 0);

    const [order] = await Order.create([{ user: userId, items, total, status: 'pending', paymentMethod: paymentMethod || 'unselected' }]);
    await Cart.updateOne({ user: userId }, { $set: { items: [] } });

    const detail = await Order.findById(order._id).populate('user', 'name email').populate('items.product', 'name brand');
    ok(res, detail, 201);
  } catch (e) { next(e); }
};

// GET /api/orders  listar con datos de usuario 
export const listOrders = async (_req, res, next) => {
  try {
    const pipeline = [
      { $sort: { createdAt: -1 } },
      { $lookup: { from: 'users', localField: 'user', foreignField: '_id', as: 'user' } },
      { $unwind: '$user' },
      { $project: { user: { name: '$user.name', email: '$user.email', _id: '$user._id' }, total: 1, status: 1, createdAt: 1 } }
    ];
    ok(res, await Order.aggregate(pipeline));
  } catch (e) { next(e); }
};

// GET /api/orders/stats total de pedidos por estado
export const statsByStatus = async (_req, res, next) => {
  try {
    const pipeline = [
      { $group: { _id: '$status', orders: { $sum: 1 }, totalAmount: { $sum: '$total' } } },
      { $project: { status: '$_id', _id: 0, orders: 1, totalAmount: 1 } },
      { $sort: { orders: -1 } }
    ];
    ok(res, await Order.aggregate(pipeline));
  } catch (e) { next(e); }
};

// GET /api/orders/user/:userId 
export const listOrdersByUser = async (req, res, next) => {
  try {
    ok(res, await Order.find({ user: req.params.userId }).sort({ createdAt: -1 }));
  } catch (e) { next(e); }
};

// PATCH /api/orders/:id/status  USO DE $SET
export const updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const o = await Order.findByIdAndUpdate(req.params.id, { $set: { status } }, { new: true });
    if (!o) return fail(res, 'Orden no encontrada', 404);
    ok(res, o);
  } catch (e) { next(e); }
};

// GET /api/orders/:id  obtener orden con datos de usuario y productos
export const getOrder = async (req, res, next) => {
  try {
    const o = await Order.findById(req.params.id).populate('user', 'name email').populate('items.product', 'name');
    if (!o) return fail(res, 'Orden no encontrada', 404);
    ok(res, o);
  } catch (e) { next(e); }
};

// DELETE /api/orders/:id  eliminar orden
export const deleteOrder = async (req, res, next) => {
  try {
    const o = await Order.findByIdAndDelete(req.params.id);
    if (!o) return fail(res, 'Orden no encontrada', 404);
    ok(res, { id: o._id });
  } catch (e) { next(e); }
};
