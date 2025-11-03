import { Router } from 'express';
import {
  createOrderFromCart, listOrders, listOrdersByUser, getOrder,
  updateOrderStatus, statsByStatus, statsItemsSold
} from '../controllers/orderController.js';
import { protect, isAdmin, ownerOrAdmin } from '../middlewares/auth.js';

const router = Router();

// Crear desde carrito (owner o admin)
router.post('/', protect, createOrderFromCart); // usa req.body.userId o req.user._id

// Listados
router.get('/', protect, isAdmin, listOrders); // admin
router.get('/user/:userId', protect, ownerOrAdmin('userId'), listOrdersByUser);

// Detalle (owner o admin)
router.get('/:id', protect, getOrder);

// Cambiar estado (admin)
router.patch('/:id/status', protect, isAdmin, updateOrderStatus);

// Stats (admin)
router.get('/stats/summary', protect, isAdmin, statsByStatus);

router.get('/stats', protect, isAdmin, statsByStatus); 

router.get('/stats/items-sold', protect, isAdmin, statsItemsSold);

export default router;
