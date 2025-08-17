const express = require('express');
const router = express.Router();

const { signup, login, logout, getCurrentUser } = require('../controllers/authController');
const { authMiddleware } = require('../middleware/auth');
const { signupValidation, loginValidation } = require('../middleware/validation');

// Public routes
router.post('/signup', signupValidation, signup);
router.post('/login', loginValidation, login);
router.post('/logout', logout);

// Protected routes
router.get('/me', authMiddleware, getCurrentUser);

module.exports = router;
