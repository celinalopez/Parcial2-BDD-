import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Cart from '../models/Cart.js';
import { ok, fail } from '../utils/response.js';

const sign = (user) =>
  jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '1d' });

//#region AUTH PUBLICO
// POST /api/users/register
export const registerPublic = async (req, res, next) => {
  try {
    const { name, email, password} = req.body; // se ignora rol
    if (!name || !email || !password) return fail(res, 'name, email y password son requeridos', 400);

    const exists = await User.findOne({ email });
    if (exists) return fail(res, 'Email ya registrado', 409);

    const user = await User.create({ name, email, password, role: 'client' }); // no aceptar rol del body
    const token = sign(user);
    ok(res, { user: { id: user._id, name: user.name, email: user.email, role: user.role }, token }, 201);
  } catch (e) { next(e); }
};

// POST /api/users/login 
export const loginPublic = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return fail(res, 'email y password son requeridos', 400);

    const user = await User.findOne({ email }).select('+password');
    if (!user) return fail(res, 'Credenciales inválidas', 401);

    const valid = await user.comparePassword(password);
    if (!valid) return fail(res, 'Credenciales inválidas', 401);

    const token = sign(user);
    ok(res, { user: { id: user._id, name: user.name, email: user.email, role: user.role }, token });
  } catch (e) { next(e); }
};

//#region CRUD ADMIN

// GET /api/users  - con filtros $or, $and, $eq, $gte, $lte
export const listUsers = async (req, res, next) => {
  try {
    const { q, role, createdFrom, createdTo } = req.query;
    const and = [];
    if (q) and.push({ $or: [{ name: { $regex: q, $options: 'i' } }, { email: { $regex: q, $options: 'i' } }] });
    if (role) and.push({ role: { $eq: role } });
    if (createdFrom || createdTo) {
      and.push({ createdAt: { ...(createdFrom ? { $gte: new Date(createdFrom) } : {}), ...(createdTo ? { $lte: new Date(createdTo) } : {}) } });
    }
    const filter = and.length ? { $and: and } : {};
    const users = await User.find(filter).sort({ createdAt: -1 });
    ok(res, users);
  } catch (e) { next(e); }
};

// GET /api/users/:id 
export const getUser = async (req, res, next) => {
  try {
    const u = await User.findById(req.params.id);
    if (!u) return fail(res, 'user no encontrado', 404);
    ok(res, u);
  } catch (e) { next(e); }
};

// POST /api/users 
export const createUser = async (req, res, next) => {
  try {
    const u = await User.create(req.body); 
    ok(res, u, 201);
  } catch (e) { next(e); }
};

// PATCH /api/users/:id USO $SET 
export const updateUser = async (req, res, next) => {
  try {
    const u = await User.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true, runValidators: true });
    if (!u) return fail(res, 'user no encontrado', 404);
    ok(res, u);
  } catch (e) { next(e); }
};

// DELETE /api/users/:id esto elimina user y su carrito 
export const deleteUser = async (req, res, next) => {
  try {
    const u = await User.findByIdAndDelete(req.params.id);
    if (!u) return fail(res, 'user no encontrado', 404);
    await Cart.deleteOne({ user: u._id });
    ok(res, { id: u._id });
  } catch (e) { next(e); }
};

//#region ADMIN O OWNER

// POST /api/users/me/address -> agrega otra direccion USO DE $PUSH 
export const addAddress = async (req, res, next) => {
  try {
    const { address } = req.body;
    if (!address) return fail(res, 'address requerido', 400);
    const u = await User.findByIdAndUpdate(req.user._id, { $push: { addresses: address } }, { new: true, runValidators: true });
    ok(res, u);
  } catch (e) { next(e); }
};

// DELETE /api/users/me/address USO DE $PULL
export const removeAddress = async (req, res, next) => {
  try {
    const { street } = req.body;
    if (!street) return fail(res, 'street requerido', 400);
    const u = await User.findByIdAndUpdate(req.user._id, { $pull: { addresses: { street } } }, { new: true });
    ok(res, u);
  } catch (e) { next(e); }
};

// GET /api/users/me
export const getMe = async (req, res, next) => {
  try {
    const me = await User.findById(req.user._id);
    return res.json({ success: true, data: me });
  } catch (e) { next(e); }
};

// PATCH /api/users/me  
export const updateMe = async (req, res, next) => {
  try {
    const allowed = ['name', 'phone', 'email']; 
    const data = {};
    for (const k of allowed) if (k in req.body) data[k] = req.body[k];

    const updated = await User.findByIdAndUpdate(req.user._id, { $set: data }, { new: true, runValidators: true });
    return res.json({ success: true, data: updated });
  } catch (e) { next(e); }
};

//TO DO: requiere password actual y nuevo
// PATCH /api/users/me/password 
export const updateMyPassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, error: 'currentPassword y newPassword requeridos' });
    }

    const user = await User.findById(req.user._id).select('+password');
    if (!user) return res.status(404).json({ success: false, error: 'user no encontrado' });

    const valid = await user.comparePassword(currentPassword);
    if (!valid) return res.status(401).json({ success: false, error: 'Password actual incorrecto' });

    // Setear y guardar para que dispare pre('save') y hashee
    user.password = newPassword;
    await user.save();

    return res.json({ success: true, data: { updated: true } });
  } catch (e) { next(e); }
};
