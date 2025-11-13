const db = require('../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Secret keys (should be in environment variables)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key';

// Register new user
exports.register = async (req, res) => {
  const { username, email, password, firstName, lastName, phone, address } = req.body;

  try {
    // Validate required fields
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Please provide username, email, and password' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    // Validate phone format if provided
    if (phone) {
      const phoneRegex = /^09\d{9}$/;
      if (!phoneRegex.test(phone)) {
        return res.status(400).json({ message: 'Phone number must be in Philippine format (09XXXXXXXXX)' });
      }
    }

    // Check if user already exists
    const [existingUsers] = await db.promise().query(
      'SELECT id FROM users WHERE username = ? OR email = ?',
      [username, email]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({ message: 'Username or email already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new user
    const [result] = await db.promise().query(
      `INSERT INTO users (username, email, password, firstName, lastName, phone, address, role, isBlocked, isHidden, loginCount, totalLoginAttempts) 
       VALUES (?, ?, ?, ?, ?, ?, ?, 'User', 0, 0, 0, 0)`,
      [username, email, hashedPassword, firstName || null, lastName || null, phone || null, address || null]
    );

    res.status(201).json({ 
      message: 'User registered successfully',
      userId: result.insertId 
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Login user
exports.login = async (req, res) => {
  const { username, password } = req.body;

  try {
    // Validate input
    if (!username || !password) {
      return res.status(400).json({ message: 'Please provide username and password' });
    }

    // Find user by username or email
    const [users] = await db.promise().query(
      'SELECT * FROM users WHERE username = ? OR email = ?',
      [username, username]
    );

    if (users.length === 0) {
      // Log failed login attempt for non-existent user
      await db.promise().query(
        'INSERT INTO login_history (username, email, ipAddress, userAgent, success) VALUES (?, ?, ?, ?, ?)',
        [username, username, req.ip || req.connection.remoteAddress || 'unknown', req.get('User-Agent') || 'unknown', false]
      );
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = users[0];

    // Check if user is blocked
    if (user.isBlocked) {
      return res.status(403).json({ message: 'Your account has been blocked. Please contact administrator.' });
    }

    // Check if user is hidden
    if (user.isHidden) {
      return res.status(403).json({ message: 'Account not found' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);

    // Update total login attempts
    await db.promise().query(
      'UPDATE users SET totalLoginAttempts = totalLoginAttempts + 1 WHERE id = ?',
      [user.id]
    );

    if (!isValidPassword) {
      // Log failed login attempt to login_history table
      await db.promise().query(
        'INSERT INTO login_history (userId, username, email, role, ipAddress, userAgent, success) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [user.id, user.username, user.email, user.role, req.ip || req.connection.remoteAddress || 'unknown', req.get('User-Agent') || 'unknown', false]
      );
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate tokens
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    const refreshToken = jwt.sign(
      { id: user.id, username: user.username },
      JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );

    // Update last login and login count
    await db.promise().query(
      'UPDATE users SET lastLogin = NOW(), loginCount = loginCount + 1 WHERE id = ?',
      [user.id]
    );

    // Log successful login to login_history table
    await db.promise().query(
      'INSERT INTO login_history (userId, username, email, role, ipAddress, userAgent, success) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [user.id, user.username, user.email, user.role, req.ip || req.connection.remoteAddress || 'unknown', req.get('User-Agent') || 'unknown', true]
    );

    res.json({
      message: 'Login successful',
      token,
      refreshToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        address: user.address,
        role: user.role,
        loginCount: user.loginCount + 1,
        totalLoginAttempts: user.totalLoginAttempts + 1
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Refresh token
exports.refreshToken = async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(401).json({ message: 'Refresh token required' });
  }

  try {
    const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);

    // Generate new access token
    const newToken = jwt.sign(
      { id: decoded.id, username: decoded.username, role: decoded.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ token: newToken });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(401).json({ message: 'Invalid or expired refresh token' });
  }
};

// Get user profile
exports.getProfile = async (req, res) => {
  const userId = req.user.id;
  
  try {
    const [users] = await db.promise().query(
      `SELECT 
        id, username, email, firstName, lastName, 
        phone, address, role, isBlocked, 
        DATE_FORMAT(createdAt, '%Y-%m-%d %H:%i:%s') as createdAt, 
        DATE_FORMAT(lastLogin, '%Y-%m-%d %H:%i:%s') as lastLogin,
        loginCount, totalLoginAttempts
      FROM users WHERE id = ?`,
      [userId]
    );
    
    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(users[0]);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update user profile
exports.updateProfile = async (req, res) => {
  const userId = req.user.id;
  const { username, email, firstName, lastName, phone, address } = req.body;
  
  try {
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }
    
    // Validate phone format if provided
    if (phone) {
      const phoneRegex = /^09\d{9}$/;
      if (!phoneRegex.test(phone)) {
        return res.status(400).json({ message: 'Phone number must be in Philippine format (09XXXXXXXXX)' });
      }
    }
    
    // Check if username or email already exists for another user
    const [existingUsers] = await db.promise().query(
      'SELECT id FROM users WHERE (username = ? OR email = ?) AND id != ?',
      [username, email, userId]
    );
    
    if (existingUsers.length > 0) {
      return res.status(400).json({ message: 'Username or email already taken' });
    }
    
    await db.promise().query(
      `UPDATE users SET 
        username = ?, 
        email = ?, 
        firstName = ?, 
        lastName = ?, 
        phone = ?, 
        address = ?
      WHERE id = ?`,
      [username, email, firstName, lastName, phone, address, userId]
    );
    
    const [updatedUser] = await db.promise().query(
      `SELECT 
        id, username, email, firstName, lastName, 
        phone, address, role, isBlocked, 
        DATE_FORMAT(createdAt, '%Y-%m-%d %H:%i:%s') as createdAt, 
        DATE_FORMAT(lastLogin, '%Y-%m-%d %H:%i:%s') as lastLogin,
        loginCount, totalLoginAttempts
      FROM users WHERE id = ?`,
      [userId]
    );
    
    res.json(updatedUser[0]);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Change password
exports.changePassword = async (req, res) => {
  const userId = req.user.id;
  const { currentPassword, newPassword } = req.body;
  
  try {
    // Get current user
    const [users] = await db.promise().query(
      'SELECT password, username, email, firstName, lastName FROM users WHERE id = ?',
      [userId]
    );
    
    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const user = users[0];
    
    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }
    
    // Validate new password
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }
    
    // Check if new password contains personal information
    const personalInfo = [user.username, user.email, user.firstName, user.lastName].filter(Boolean);
    const containsPersonalInfo = personalInfo.some(info =>
      newPassword.toLowerCase().includes(info.toLowerCase())
    );

    if (containsPersonalInfo) {
      return res.status(400).json({ message: 'Password should not contain personal information' });
    }
    
    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    await db.promise().query(
      'UPDATE users SET password = ? WHERE id = ?',
      [hashedPassword, userId]
    );
    
    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all users (excluding hidden users) - Shows ALL users including those who never logged in
exports.getAllUsers = async (req, res) => {
  try {
    console.log('Fetching all users...');
    
    // First, check total user count
    const [countResult] = await db.promise().query(
      'SELECT COUNT(*) as total FROM users'
    );
    console.log(`Total users in database: ${countResult[0].total}`);
    
    // Fetch all non-hidden users
    const [users] = await db.promise().query(
      `SELECT
        id,
        username,
        email,
        firstName,
        lastName,
        phone,
        address,
        role,
        isBlocked,
        isHidden,
        DATE_FORMAT(createdAt, '%Y-%m-%d %H:%i:%s') as createdAt,
        DATE_FORMAT(lastLogin, '%Y-%m-%d %H:%i:%s') as lastLogin,
        COALESCE(loginCount, 0) as loginCount,
        COALESCE(totalLoginAttempts, 0) as totalLoginAttempts
      FROM users
      WHERE (isHidden = 0 OR isHidden IS NULL)
      ORDER BY createdAt DESC`
    );

    console.log(`Returning ${users.length} users (non-hidden)`);
    
    // Log user details for debugging
    if (users.length > 0) {
      console.log('Sample user data:', {
        id: users[0].id,
        username: users[0].username,
        loginCount: users[0].loginCount,
        totalLoginAttempts: users[0].totalLoginAttempts,
        lastLogin: users[0].lastLogin
      });
      
      const loggedInUsers = users.filter(u => u.loginCount > 0).length;
      const neverLoggedIn = users.filter(u => u.loginCount === 0).length;
      console.log(`Users who logged in: ${loggedInUsers}`);
      console.log(`Users who never logged in: ${neverLoggedIn}`);
    }

    res.json(users);
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message,
      details: error.stack 
    });
  }
};

// Block user (Admin only)
exports.blockUser = async (req, res) => {
  const { userId } = req.params;
  
  try {
    // Check if user exists and is not an admin
    const [users] = await db.promise().query(
      'SELECT role FROM users WHERE id = ?',
      [userId]
    );
    
    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    if (users[0].role === 'Administrator') {
      return res.status(403).json({ message: 'Cannot block administrator accounts' });
    }
    
    await db.promise().query(
      'UPDATE users SET isBlocked = 1 WHERE id = ?',
      [userId]
    );
    
    res.json({ message: 'User blocked successfully' });
  } catch (error) {
    console.error('Block user error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Unblock user (Admin only)
exports.unblockUser = async (req, res) => {
  const { userId } = req.params;
  
  try {
    await db.promise().query(
      'UPDATE users SET isBlocked = 0 WHERE id = ?',
      [userId]
    );
    
    res.json({ message: 'User unblocked successfully' });
  } catch (error) {
    console.error('Unblock user error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Hide user (Admin only)
exports.hideUser = async (req, res) => {
  const { userId } = req.params;
  
  try {
    // Check if user exists and is not an admin
    const [users] = await db.promise().query(
      'SELECT role FROM users WHERE id = ?',
      [userId]
    );
    
    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    if (users[0].role === 'Administrator') {
      return res.status(403).json({ message: 'Cannot hide administrator accounts' });
    }
    
    await db.promise().query(
      'UPDATE users SET isHidden = 1 WHERE id = ?',
      [userId]
    );
    
    res.json({ message: 'User hidden successfully' });
  } catch (error) {
    console.error('Hide user error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete user (Admin only - optional, use with caution)
exports.deleteUser = async (req, res) => {
  const { userId } = req.params;
  
  try {
    // Check if user exists and is not an admin
    const [users] = await db.promise().query(
      'SELECT role FROM users WHERE id = ?',
      [userId]
    );
    
    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    if (users[0].role === 'Administrator') {
      return res.status(403).json({ message: 'Cannot delete administrator accounts' });
    }
    
    // Delete user (this will cascade delete related records if foreign keys are set up)
    await db.promise().query(
      'DELETE FROM users WHERE id = ?',
      [userId]
    );
    
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};