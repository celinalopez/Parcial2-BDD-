import { Router } from 'express';
import {
  getCart, addItem, updateItemQty, removeItem, clearCart, getTotals
} from '../controllers/cartController.js';
import { protect, ownerOrAdmin } from '../middlewares/auth.js';

const router = Router();

// Todas requieren estar logueado y ser dueño del carrito (o admin)
router.get('/:userId', protect, ownerOrAdmin('userId'), getCart);
router.get('/:userId/total', protect, ownerOrAdmin('userId'), getTotals);

router.post('/:userId/items', protect, ownerOrAdmin('userId'), addItem);
router.patch('/:userId/items/:productId', protect, ownerOrAdmin('userId'), updateItemQty);
router.delete('/:userId/items/:productId', protect, ownerOrAdmin('userId'), removeItem);

router.delete('/:userId', protect, ownerOrAdmin('userId'), clearCart);

export default router;
