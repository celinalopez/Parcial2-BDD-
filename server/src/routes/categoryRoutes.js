import { Router } from 'express';
import {
  listCategories,
  createCategory,
  getCategory,
  updateCategory,
  deleteCategory,
  categoryStats,
} from '../controllers/categoryController.js';
import { protect, isAdmin } from '../middlewares/auth.js';
import { validateObjectIdParam } from '../middlewares/validators.js';

const router = Router();

// públicas
router.get('/', listCategories);                                     // GET    /api/categories
// ⚠️ ruta fija ANTES que :id para evitar colisión
router.get('/stats', protect, isAdmin, categoryStats);               // GET    /api/categories/stats
router.get('/:id', validateObjectIdParam('id'), getCategory);        // GET    /api/categories/:id

// admin
router.post('/', protect, isAdmin, createCategory);                  // POST   /api/categories
router.patch('/:id', protect, isAdmin, validateObjectIdParam('id'), updateCategory);     // PATCH  /api/categories/:id
router.delete('/:id', protect, isAdmin, validateObjectIdParam('id'), deleteCategory);    // DELETE /api/categories/:id

export default router;
