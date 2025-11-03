import { Router } from 'express';
import {
  registerUser,
  loginUser,
  getMe,
  updateMe,
  listUsers,
  deleteUser,
  getUserById,
  updateUserById,
  searchUsers,
  addAddress
} from '../controllers/userController.js';
import { protect, isAdmin } from '../middlewares/auth.js';

const router = Router();

// Publicas
router.post('/register', registerUser);
router.post('/login', loginUser);

// Autenticadas (perfil propio)
router.get('/me', protect, getMe);
router.patch('/me', protect, updateMe);

// Admin
router.get('/', protect, isAdmin, listUsers);
router.get('/search', protect, isAdmin, searchUsers);   // ?q=cel&page=1&limit=10
router.get('/:id', protect, isAdmin, getUserById);
router.patch('/:id', protect, isAdmin, updateUserById);
router.delete('/:id', protect, isAdmin, deleteUser);
router.get('/search', protect, isAdmin, searchUsers);
router.post('/me/address', protect, addAddress); // ejemplo de $push

export default router;
