import User from '../models/User.js';
import Cart from '../models/Cart.js'; // para eliminar carrito del user
import { signToken } from '../utils/jwt.js';

// Helpers para respuestas consistentes
const ok = (res, data, status = 200) => res.status(status).json({ success: true, data });
const fail = (res, error, status = 400) => res.status(status).json({ success: false, error });

export const registerUser = async (req, res, next) => {
  try {
    const { name, email, password, phone } = req.body;
    if (!name || !email || !password) {
      return fail(res, 'name, email y password son requeridos', 400);
    }
    const exists = await User.findOne({ email });
    if (exists) return fail(res, 'Email ya registrado', 409);

    const user = await User.create({ name, email, password, phone });
    const token = signToken({ id: user._id, role: user.role });

    return ok(res, {
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    }, 201);
  } catch (e) { next(e); }
};

export const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return fail(res, 'email y password son requeridos', 400);

    const user = await User.findOne({ email }).select('+password');
    if (!user) return fail(res, 'Credenciales inválidas', 401);

    const isMatch = await user.matchPassword(password);
    if (!isMatch) return fail(res, 'Credenciales inválidas', 401);

    const token = signToken({ id: user._id, role: user.role });

    return ok(res, {
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (e) { next(e); }
};

export const getMe = async (req, res, next) => {
  try {
    // req.user seteado por protect
    const user = await User.findById(req.user._id).select('-password');
    return ok(res, user);
  } catch (e) { next(e); }
};

// (Opcional) actualizar perfil propio
export const updateMe = async (req, res, next) => {
  try {
    const updates = { name: req.body.name, phone: req.body.phone, addresses: req.body.addresses };
    // si incluye password, volverá a hashear por pre('save')
    const user = await User.findById(req.user._id).select('+password');
    if (!user) return fail(res, 'Usuario no encontrado', 404);

    if (req.body.name !== undefined) user.name = req.body.name;
    if (req.body.phone !== undefined) user.phone = req.body.phone;
    if (req.body.addresses !== undefined) user.addresses = req.body.addresses;
    if (req.body.password) user.password = req.body.password;

    await user.save();
    return ok(res, { id: user._id, name: user.name, email: user.email, role: user.role });
  } catch (e) { next(e); }
};

// ADMIN: listar todos
export const listUsers = async (_req, res, next) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    return ok(res, users);
  } catch (e) { next(e); }
};

// ADMIN: eliminar usuario (y su carrito)
export const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const u = await User.findById(id);
    if (!u) return fail(res, 'Usuario no encontrado', 404);

    await Cart.deleteMany({ user: id }); // limpia carrito(s) del usuario
    await User.findByIdAndDelete(id);

    return ok(res, { id }, 200);
  } catch (e) { next(e); }
};


// Obtener un usuario por id (ADMIN)
export const getUserById = async (req, res, next) => {
  try {
    const u = await User.findById(req.params.id).select('-password');
    if (!u) return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
    return res.status(200).json({ success: true, data: u });
  } catch (e) { next(e); }
};

// Actualizar usuario por id (ADMIN)
export const updateUserById = async (req, res, next) => {
  try {
    const allowed = ['name', 'email', 'phone', 'role', 'addresses'];
    const updates = {};
    for (const k of allowed) if (k in req.body) updates[k] = req.body[k];

    // Si viene password, lo tratamos aparte: usamos findById + save para disparar pre('save')
    if ('password' in req.body) {
      const u = await User.findById(req.params.id).select('+password');
      if (!u) return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
      Object.assign(u, updates);
      u.password = req.body.password;
      await u.save();
      return res.status(200).json({
        success: true,
        data: { id: u._id, name: u.name, email: u.email, role: u.role }
      });
    }

    const u = await User.findByIdAndUpdate(req.params.id, updates, {
      new: true, runValidators: true, projection: { password: 0 }
    });
    if (!u) return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
    return res.status(200).json({ success: true, data: u });
  } catch (e) { next(e); }
};

// (Opcional) Búsqueda paginada por query (ADMIN) ?q=texto&page=1&limit=10
export const searchUsers = async (req, res, next) => {
  try {
    const { q = '', page = 1, limit = 10 } = req.query;
    const filter = q
      ? { $or: [{ name: new RegExp(q, 'i') }, { email: new RegExp(q, 'i') }] }
      : {};
    const skip = (Number(page) - 1) * Number(limit);
    const [items, total] = await Promise.all([
      User.find(filter).select('-password').sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      User.countDocuments(filter)
    ]);
    return res.status(200).json({
      success: true,
      data: { items, page: Number(page), limit: Number(limit), total }
    });
  } catch (e) { next(e); }
};
