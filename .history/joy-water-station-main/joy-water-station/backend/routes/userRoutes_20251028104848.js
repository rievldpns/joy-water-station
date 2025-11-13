const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate, authorizeAdmin } = require('../middleware/auth');

// Public routes
router.post('/register', userController.register);
router.post('/login', userController.login);
router.post('/refresh-token', userController.refreshToken);

// Protected routes
router.get('/profile', authenticate, userController.getProfile);
router.put('/profile', authenticate, userController.updateProfile);
router.put('/change-password', authenticate, userController.changePassword);

// Admin routes
router.get('/all', authenticate, authorizeAdmin, userController.getAllUsers);
router.put('/:userId/block', authenticate, authorizeAdmin, userController.blockUser);
router.put('/:userId/unblock', authenticate, authorizeAdmin, userController.unblockUser);

module.exports = router;
