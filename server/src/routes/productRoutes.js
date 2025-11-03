import { Router } from 'express';
import {
  createProduct, listProducts, getProduct,
  updateProduct, deleteProduct, patchStock, topReviewed
} from '../controllers/productController.js';
import { protect, isAdmin } from '../middlewares/auth.js';

const router = Router();

// públicas
router.get('/', listProducts);
router.get('/top', topReviewed);
router.get('/:id', getProduct);

// admin
router.post('/', protect, isAdmin, createProduct);
router.patch('/:id', protect, isAdmin, updateProduct);
router.delete('/:id', protect, isAdmin, deleteProduct);
router.patch('/:id/stock', protect, isAdmin, patchStock);

export default router;
