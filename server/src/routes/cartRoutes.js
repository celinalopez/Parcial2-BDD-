import { Router } from 'express';
import {
  getCart,
  addItem,
  updateItemQty,
  removeItem,
  clearCart,
  getCartTotals,
} from '../controllers/cartController.js';
import { protect, ownerOrAdmin } from '../middlewares/auth.js';
import { validateObjectIdParam } from '../middlewares/validators.js';

const router = Router();

// Todas requieren owner/admin del :userId
router.get('/:userId',       protect, ownerOrAdmin('userId'), validateObjectIdParam('userId'), getCart);            // GET    /api/cart/:userId
router.post('/:userId/items',protect, ownerOrAdmin('userId'), validateObjectIdParam('userId'), addItem);            // POST   /api/cart/:userId/items
router.patch('/:userId/items/:productId',
  protect, ownerOrAdmin('userId'),
  validateObjectIdParam('userId'),
  validateObjectIdParam('productId'),
  updateItemQty
);                                                                                                                  // PATCH  /api/cart/:userId/items/:productId
router.delete('/:userId/items/:productId',
  protect, ownerOrAdmin('userId'),
  validateObjectIdParam('userId'),
  validateObjectIdParam('productId'),
  removeItem
);                                                                                                                  // DELETE /api/cart/:userId/items/:productId
router.delete('/:userId',    protect, ownerOrAdmin('userId'), validateObjectIdParam('userId'), clearCart);          // DELETE /api/cart/:userId
router.get('/:userId/total', protect, ownerOrAdmin('userId'), validateObjectIdParam('userId'), getCartTotals);      // GET    /api/cart/:userId/total

export default router;
