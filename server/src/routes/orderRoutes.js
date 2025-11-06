import { Router } from 'express';
import {
  createOrderFromCart,
  listOrders,
  listOrdersByUser,
  statsByStatus,
  updateOrderStatus,
  getOrder,
  deleteOrder,
} from '../controllers/orderController.js';
import { protect, isAdmin, ownerOrAdmin } from '../middlewares/auth.js';
import { validateObjectIdParam } from '../middlewares/validators.js';

const router = Router();

// ⚠️ rutas fijas primero
router.get('/stats', protect, isAdmin, statsByStatus);                          // GET    /api/orders/stats
router.get('/', protect, isAdmin, listOrders);                                  // GET    /api/orders
router.post('/', protect, createOrderFromCart);                                 // POST   /api/orders

// por user
router.get('/user/:userId',
  protect, ownerOrAdmin('userId'),
  validateObjectIdParam('userId'),
  listOrdersByUser
);                                                                              // GET    /api/orders/user/:userId

// por id (validación de ObjectId por middleware)
router.get('/:id', protect, validateObjectIdParam('id'), getOrder);             // GET    /api/orders/:id
router.patch('/:id/status',
  protect, isAdmin, validateObjectIdParam('id'),
  updateOrderStatus
);                                                                              // PATCH  /api/orders/:id/status
router.delete('/:id',
  protect, isAdmin, validateObjectIdParam('id'),
  deleteOrder
);                                                                              // DELETE /api/orders/:id

export default router;
