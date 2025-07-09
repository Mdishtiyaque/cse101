const express = require('express');
const rateLimit = require('express-rate-limit');
const AuthController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');
const { validateRegistration, validateLogin } = require('../middleware/validation');

const router = express.Router();

// Rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: {
    error: 'Too many authentication attempts',
    message: 'Please try again after 15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 login attempts per windowMs
  message: {
    error: 'Too many login attempts',
    message: 'Please try again after 15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Public routes
router.post('/register', authLimiter, validateRegistration, AuthController.register);
router.post('/login', loginLimiter, validateLogin, AuthController.login);

// Protected routes
router.get('/me', authenticateToken, AuthController.getProfile);
router.post('/logout', authenticateToken, AuthController.logout);

// Additional protected routes for account management
router.put('/password', authenticateToken, AuthController.updatePassword);
router.delete('/account', authenticateToken, AuthController.deleteAccount);

module.exports = router;