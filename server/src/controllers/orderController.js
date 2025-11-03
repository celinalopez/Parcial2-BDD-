import Order from '../models/Order.js';
import Cart from '../models/Cart.js';
import Product from '../models/Product.js';

const ok  = (res, data, status=200) => res.status(status).json({ success: true, data });
const err = (res, error, status=400) => res.status(status).json({ success: false, error });

/**
 * POST /api/ordenes
 * Body: { "userId": "...", "paymentMethod": "card|cash|..." }
 * Requiere: usuario autenticado y owner/admin.
 * Crea la orden desde el carrito del usuario, descuenta stock y vacía el carrito.
 */
export const createOrderFromCart = async (req, res, next) => {
  try {
    const userId = req.body.userId || String(req.user._id);
    const { paymentMethod } = req.body;

    // 1) carrito
    const cart = await Cart.findOne({ user: userId });
    if (!cart || cart.items.length === 0) {
      return res.status(409).json({ success: false, error: 'Carrito vacío' });
    }

    // 2) validar stock actual y preparar bulk por-documento
    const productIds = cart.items.map(i => i.product);
    const dbProducts = await Product.find({ _id: { $in: productIds } });

    const stockErrors = [];
    const bulk = [];
    const items = [];

    for (const ci of cart.items) {
      const p = dbProducts.find(x => String(x._id) === String(ci.product));
      if (!p) { stockErrors.push(`Producto no existe: ${ci.product}`); continue; }
      if (p.stock < ci.qty) { stockErrors.push(`Stock insuficiente: ${p._id}`); continue; }

      items.push({ product: ci.product, qty: ci.qty, price: ci.priceAtAdd, subtotal: ci.qty * ci.priceAtAdd });

      bulk.push({
        updateOne: {
          filter: { _id: p._id, stock: { $gte: ci.qty } },
          update: { $inc: { stock: -ci.qty } }
        }
      });
    }

    if (stockErrors.length) {
      return res.status(409).json({ success: false, error: `No se pudo crear la orden: ${stockErrors.join(', ')}` });
    }
    if (!items.length) {
      return res.status(409).json({ success: false, error: 'No hay ítems válidos para la orden' });
    }

    // 3) descuento de stock (atómico por documento, pero sin transacción multi-doc)
    if (bulk.length) await Product.bulkWrite(bulk);

    // 4) crear orden y vaciar carrito
    const total = items.reduce((a, it) => a + it.subtotal, 0);
    const [order] = await Order.create([{
      user: userId,
      items,
      total,
      status: 'pending',
      paymentMethod: paymentMethod || 'unselected'
    }]);

    await Cart.updateOne({ user: userId }, { $set: { items: [] } });

    const created = await Order.findById(order._id)
      .populate('items.product', 'name brand')
      .populate('user', 'name email');

    return res.status(201).json({ success: true, data: created });
  } catch (e) {
    next(e);
  }
};


/**
 * GET /api/ordenes (ADMIN)
 */
export const listOrders = async (_req, res, next) => {
  try {
    const orders = await Order.find()
      .populate('user', 'name email')
      .sort({ createdAt: -1 });
    ok(res, orders);
  } catch (e) { next(e); }
};

/**
 * GET /api/ordenes/user/:userId (owner o admin)
 */
export const listOrdersByUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const orders = await Order.find({ user: userId })
      .sort({ createdAt: -1 });
    ok(res, orders);
  } catch (e) { next(e); }
};

/**
 * GET /api/ordenes/:id (owner o admin del dueño)
 */
export const getOrder = async (req, res, next) => {
  try {
    const o = await Order.findById(req.params.id)
      .populate('items.product', 'name brand price')
      .populate('user', 'name email role');
    if (!o) return err(res, 'Orden no encontrada', 404);

    const isOwner = String(o.user._id) === String(req.user._id);
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) return err(res, 'Owner or admin only', 403);

    ok(res, o);
  } catch (e) { next(e); }
};

/**
 * PATCH /api/ordenes/:id/status (ADMIN)
 * Body: { "status": "paid|shipped|cancelled|pending" }
 * Si se cancela, opcionalmente podrías reponer stock (no se implementa aquí por simplicidad).
 */
export const updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['pending','paid','shipped','cancelled'].includes(status))
      return err(res, 'status inválido', 400);

    const o = await Order.findByIdAndUpdate(
      req.params.id,
      { $set: { status } },
      { new: true }
    );
    if (!o) return err(res, 'Orden no encontrada', 404);
    ok(res, o);
  } catch (e) { next(e); }
};

/**
 * GET /api/ordenes/stats (ADMIN)
 * Agregación: cantidad de órdenes y total facturado por estado
 */
export const statsByStatus = async (_req, res, next) => {
  try {
    const pipeline = [
      { $group: {
          _id: '$status',
          orders: { $sum: 1 },
          totalAmount: { $sum: '$total' }
      }},
      { $project: { _id: 0, status: '$_id', orders: 1, totalAmount: 1 } },
      { $sort: { orders: -1 } }
    ];
    const stats = await Order.aggregate(pipeline);
    ok(res, stats);
  } catch (e) { next(e); }
};
