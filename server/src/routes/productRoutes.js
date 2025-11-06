import { Router } from 'express';
import {
  listProducts,
  filterProducts,
  topProducts,
  createProduct,
  getProduct,
  updateProduct,
  deleteProduct,
  patchStock,
} from '../controllers/productController.js';
import { protect, isAdmin } from '../middlewares/auth.js';
import { validateObjectIdParam } from '../middlewares/validators.js';

const router = Router();

// públicas
router.get('/', listProducts);                                      // GET    /api/products
router.get('/filter', filterProducts);                               // GET    /api/products/filter
router.get('/top', topProducts);                                     // GET    /api/products/top

// detalle público
router.get('/:id', validateObjectIdParam('id'), getProduct);         // GET    /api/products/:id

// admin
router.post('/', protect, isAdmin, createProduct);                   // POST   /api/products
router.patch('/:id', protect, isAdmin, validateObjectIdParam('id'), updateProduct);      // PATCH  /api/products/:id
router.delete('/:id', protect, isAdmin, validateObjectIdParam('id'), deleteProduct);     // DELETE /api/products/:id
router.patch('/:id/stock', protect, isAdmin, validateObjectIdParam('id'), patchStock);   // PATCH  /api/products/:id/stock

export default router;
