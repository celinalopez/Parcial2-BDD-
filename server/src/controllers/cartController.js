import Cart from '../models/Cart.js';
import Product from '../models/Product.js';

const ok = (res, data, status = 200) => res.status(status).json({ success: true, data });
const fail = (res, error, status = 400) => res.status(status).json({ success: false, error });

/**
 * GET /api/carrito/:userId
 * Devuelve el carrito del usuario (crea uno vacio si no existe)
 */
export const getCart = async (req, res, next) => {
  try {
    const { userId } = req.params;
    let cart = await Cart.findOne({ user: userId }).populate('items.product', 'name brand price stock');
    if (!cart) cart = await Cart.create({ user: userId, items: [] });
    ok(res, cart);
  } catch (e) { next(e); }
};

/**
 * POST /api/carrito/:userId/items
 * Body: { "productId": "...", "qty": 2 }
 * Agrega o incrementa un item. priceAtAdd se toma del producto en ese momento.
 */
export const addItem = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { productId, qty } = req.body;
    if (!productId || !qty || qty <= 0) return fail(res, 'productId y qty>0 requeridos', 400);

    const product = await Product.findById(productId).select('price stock');
    if (!product) return fail(res, 'Producto no encontrado', 404);
    if (product.stock < qty) return fail(res, 'Stock insuficiente', 409);

    let cart = await Cart.findOne({ user: userId });
    if (!cart) cart = await Cart.create({ user: userId, items: [] });

    const idx = cart.items.findIndex(i => String(i.product) === String(productId));
    if (idx >= 0) {
      cart.items[idx].qty += qty;
    } else {
      cart.items.push({ product: productId, qty, priceAtAdd: product.price });
    }

    await cart.save();
    cart = await cart.populate('items.product', 'name brand price stock');
    ok(res, cart, 201);
  } catch (e) { next(e); }
};

/**
 * PATCH /api/carrito/:userId/items/:productId
 * Body: { "qty": 3 }  setea cantidad exacta si qty<=0, elimina
 */
export const updateItemQty = async (req, res, next) => {
  try {
    const { userId, productId } = req.params;
    const { qty } = req.body;
    let cart = await Cart.findOne({ user: userId });
    if (!cart) return fail(res, 'Carrito no encontrado', 404);

    const idx = cart.items.findIndex(i => String(i.product) === String(productId));
    if (idx < 0) return fail(res, 'Item no esta en el carrito', 404);

    if (!qty || qty <= 0) {
      cart.items.splice(idx, 1);
    } else {
      cart.items[idx].qty = qty;
    }

    await cart.save();
    cart = await cart.populate('items.product', 'name brand price stock');
    ok(res, cart);
  } catch (e) { next(e); }
};

/**
 * DELETE /api/carrito/:userId/items/:productId
 */
export const removeItem = async (req, res, next) => {
  try {
    const { userId, productId } = req.params;
    const cart = await Cart.findOneAndUpdate(
      { user: userId },
      { $pull: { items: { product: productId } } },
      { new: true }
    ).populate('items.product', 'name brand price stock');

    if (!cart) return fail(res, 'Carrito no encontrado', 404);
    ok(res, cart);
  } catch (e) { next(e); }
};

/**
 * DELETE /api/carrito/:userId
 * Vaciar carrito
 */
export const clearCart = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const cart = await Cart.findOneAndUpdate(
      { user: userId },
      { $set: { items: [] } },
      { new: true }
    );
    if (!cart) return fail(res, 'Carrito no encontrado', 404);
    ok(res, cart);
  } catch (e) { next(e); }
};

/**
 * GET /api/carrito/:userId/total
 * Calcula subtotal/total en base a priceAtAdd * qty
 */
export const getTotals = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const cart = await Cart.findOne({ user: userId });
    if (!cart) return ok(res, { subtotal: 0, itemsCount: 0 });

    const subtotal = cart.items.reduce((acc, it) => acc + (it.qty * it.priceAtAdd), 0);
    const itemsCount = cart.items.reduce((acc, it) => acc + it.qty, 0);

    ok(res, { subtotal, itemsCount });
  } catch (e) { next(e); }
};
