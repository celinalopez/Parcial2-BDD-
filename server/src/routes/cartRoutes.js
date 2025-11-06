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
router.get('/:userId',                       // GET    /api/cart/:userId
  protect, ownerOrAdmin('userId'),
  validateObjectIdParam('userId'), getCart);            
router.post('/:userId/items',                 // POST   /api/cart/:userId/items
  protect, ownerOrAdmin('userId'),
   validateObjectIdParam('userId'),
    addItem);            
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
router.delete('/:userId',         // DELETE /api/cart/:userId
    protect,
     ownerOrAdmin('userId'),
     validateObjectIdParam('userId'),
     clearCart);          
router.get('/:userId/total',    // GET    /api/cart/:userId/total
   protect, ownerOrAdmin('userId'),
    validateObjectIdParam('userId'),
     getCartTotals);      

export default router;
