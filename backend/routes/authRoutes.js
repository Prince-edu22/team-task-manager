import express from 'express';
import { body } from 'express-validator';
import { register, login, getUsers } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post(
  '/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('name').notEmpty().trim(),
    body('role').optional().isIn(['ADMIN', 'MEMBER'])
  ],
  register
);

router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty()
  ],
  login
);

router.get('/users', protect, getUsers);

export default router;