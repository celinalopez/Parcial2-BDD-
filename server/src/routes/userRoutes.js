import { Router } from 'express';
import { protect, isAdmin } from '../middlewares/auth.js';
import { validateObjectIdParam } from '../middlewares/validators.js';
import {
  registerPublic, loginPublic,
  listUsers, getUser, createUser, updateUser, deleteUser,
  addAddress, removeAddress,
  getMe, updateMe, updateMyPassword
} from '../controllers/userController.js';

const router = Router();

/** Auth público */
router.post('/register', registerPublic);             // POST /api/users/register
router.post('/login', loginPublic);                   // POST /api/users/login

// Owner
router.get('/me', protect, getMe);
router.patch('/me', protect, updateMe);
router.patch('/me/password', protect, updateMyPassword);

/** Admin CRUD */
router.get('/', protect, isAdmin, listUsers);         // GET    /api/users
router.get('/:id', protect, isAdmin, validateObjectIdParam('id'), getUser);        // GET    /api/users/:id
router.post('/', protect, isAdmin, createUser);       // POST   /api/users
router.patch('/:id', protect, isAdmin, validateObjectIdParam('id'), updateUser);   // PATCH  /api/users/:id
router.delete('/:id', protect, isAdmin, validateObjectIdParam('id'), deleteUser);  // DELETE /api/users/:id

/** Extras (owner) */
router.post('/me/address', protect, addAddress);      // $push
router.delete('/me/address', protect, removeAddress); // $pull

export default router;
