const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate, authorizeAdmin } = require('../middleware/auth');

// Public routes
router.post('/register', userController.register);
router.post('/login', userController.login);
router.post('/refresh-token', userController.refreshToken);

// Protected routes - All authenticated users can access
router.get('/profile', authenticate, userController.getProfile);
router.put('/profile', authenticate, userController.updateProfile);
router.put('/change-password', authenticate, userController.changePassword);

// Admin routes - Only for viewing and managing user status
router.get('/all', authenticate, authorizeAdmin, userController.getAllUsers);
router.get('/logged-in', authenticate, authorizeAdmin, userController.getLoggedInUsers);
router.put('/:userId/block', authenticate, authorizeAdmin, userController.blockUser);
router.put('/:userId/unblock', authenticate, authorizeAdmin, userController.unblockUser);
router.put('/:userId/hide', authenticate, authorizeAdmin, userController.hideUser);

module.exports = router;