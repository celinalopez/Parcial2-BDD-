import { Router } from 'express';
import {
  listAllReviews,
  listReviewsByProduct,
  topProductsByReviews,
  createReview,
  updateReview,
  deleteReview,
} from '../controllers/reviewController.js';
import { protect, isAdmin } from '../middlewares/auth.js';
import { validateObjectIdParam } from '../middlewares/validators.js';

const router = Router();

// admin: listar todas con populate
router.get('/', protect, isAdmin, listAllReviews);                               // GET    /api/reviews

// público
router.get('/product/:productId', validateObjectIdParam('productId'), listReviewsByProduct); // GET /api/reviews/product/:productId
router.get('/top', topProductsByReviews);                                        // GET    /api/reviews/top

// autenticado
router.post('/', protect, createReview);                                         // POST   /api/reviews
router.patch('/:id', protect, validateObjectIdParam('id'), updateReview);        // PATCH  /api/reviews/:id
router.delete('/:id', protect, validateObjectIdParam('id'), deleteReview);       // DELETE /api/reviews/:id

export default router;
