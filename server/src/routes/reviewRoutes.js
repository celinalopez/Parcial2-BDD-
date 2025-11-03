import { Router } from 'express';
import {
  createReview, updateReview, deleteReview,
  listReviewsByProduct, getMyReviewForProduct,
  topProductsByReviews
} from '../controllers/reviewController.js';
import { protect } from '../middlewares/auth.js';

const router = Router();

// públicas
router.get('/product/:productId', listReviewsByProduct);
router.get('/top', topProductsByReviews);

// autenticadas
router.get('/me/product/:productId', protect, getMyReviewForProduct);
router.post('/', protect, createReview);
router.patch('/:id', protect, updateReview);
router.delete('/:id', protect, deleteReview);

export default router;
