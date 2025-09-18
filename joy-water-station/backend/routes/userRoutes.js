const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateToken, authorizeAdmin } = require('../middleware/authMiddleware');

// Public routes
router.post('/register', userController.register);
router.post('/login', userController.login);

// Protected routes
router.get('/profile', authenticateToken, userController.getProfile);
router.put('/profile', authenticateToken, userController.updateProfile);
router.put('/password', authenticateToken, userController.changePassword);

// Admin routes
router.get('/all', authenticateToken, authorizeAdmin, userController.getAllUsers);
router.put('/:userId/block', authenticateToken, authorizeAdmin, userController.blockUser);
router.put('/:userId/unblock', authenticateToken, authorizeAdmin, userController.unblockUser);

module.exports = router;
