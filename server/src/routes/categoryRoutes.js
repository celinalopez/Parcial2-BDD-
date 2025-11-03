import { Router } from 'express';
import {
  createCategory, listCategories, getCategory,
  updateCategory, deleteCategory, statsProductsByCategory
} from '../controllers/categoryController.js';
import { protect, isAdmin } from '../middlewares/auth.js';

const router = Router();

router.get('/', listCategories);
router.get('/stats', protect, isAdmin, statsProductsByCategory);
router.get('/:id', getCategory);

router.post('/', protect, isAdmin, createCategory);
router.patch('/:id', protect, isAdmin, updateCategory);
router.delete('/:id', protect, isAdmin, deleteCategory);

export default router;
