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

// All authenticated users can view the user list
router.get('/all', authenticate, userController.getAllUsers);

// All authenticated users can view login history
router.get('/login-history', authenticate, userController.getLoginHistory);

// All authenticated users can view their own login history
router.get('/:userId/login-history', authenticate, userController.getUserLoginHistory);

// Admin-only routes - Only for blocking and hiding users
router.put('/:userId/block', authenticate, authorizeAdmin, userController.blockUser);
router.put('/:userId/unblock', authenticate, authorizeAdmin, userController.unblockUser);
router.put('/:userId/hide', authenticate, authorizeAdmin, userController.hideUser);

module.exports = router;