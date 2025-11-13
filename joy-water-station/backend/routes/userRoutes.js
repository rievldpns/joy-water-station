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

// Get login history for a user (Admin only)
router.get('/:userId/login-history', authenticate, authorizeAdmin, async (req, res) => {
  const { userId } = req.params;
  const { limit = 10, offset = 0 } = req.query;

  try {
    const db = require('../db');
    const [history] = await db.promise().query(
      'SELECT id, username, email, role, ipAddress, userAgent, success, DATE_FORMAT(loginTime, "%Y-%m-%d %H:%i:%s") as loginTime FROM login_history WHERE userId = ? ORDER BY loginTime DESC LIMIT ? OFFSET ?',
      [userId, parseInt(limit), parseInt(offset)]
    );

    res.json(history);
  } catch (error) {
    console.error('Get login history error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Admin-only routes - Only for blocking and hiding users
router.put('/:userId/block', authenticate, authorizeAdmin, userController.blockUser);
router.put('/:userId/unblock', authenticate, authorizeAdmin, userController.unblockUser);
router.put('/:userId/hide', authenticate, authorizeAdmin, userController.hideUser);

module.exports = router;