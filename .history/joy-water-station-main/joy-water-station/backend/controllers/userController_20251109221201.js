const db = require('../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key';

const JWT_SECRET = jwtSecret;
const JWT_REFRESH_SECRET = jwtRefreshSecret;

// Register new user
exports.register = async (req, res) => {
  const { username, email, password, firstName, lastName, phone, address } = req.body;

  try {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    const phoneRegex = /^09\d{9}$/;
    if (phone && !phoneRegex.test(phone)) {
      return res.status(400).json({ message: 'Phone number must be in Philippine format (starts with 09, exactly 11 digits)' });
    }

    const [existingUsers] = await db.promise().query(
      'SELECT id FROM users WHERE username = ? OR email = ?',
      [username, email]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({ message: 'Username or email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await db.promise().query(
      'INSERT INTO users (username, email, password, firstName, lastName, phone, address, lastLogin) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)',
      [username, email, hashedPassword, firstName, lastName, phone, address]
    );

    const [users] = await db.promise().query(
      'SELECT id, username, email, firstName, lastName, phone, address, role, DATE_FORMAT(createdAt, "%Y-%m-%d %H:%i:%s") as createdAt, DATE_FORMAT(lastLogin, "%Y-%m-%d %H:%i:%s") as lastLogin, isBlocked FROM users WHERE id = ?',
      [result.insertId]
    );

    const user = users[0];

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      refreshToken,
      user
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Login user
exports.login = async (req, res) => {
  const { username, password } = req.body;

  try {
    const [users] = await db.promise().query(
      'SELECT * FROM users WHERE (username = ? OR email = ?) AND (isHidden IS NULL OR isHidden = FALSE)',
      [username, username]
    );

    if (users.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = users[0];

    if (user.isBlocked) {
      // Log blocked login attempt
      const ipAddress = req.ip || req.connection.remoteAddress || req.socket.remoteAddress || 'unknown';
      const userAgent = req.get('User-Agent') || 'unknown';

      await db.promise().query(
        'INSERT INTO login_logs (userId, ipAddress, userAgent, success) VALUES (?, ?, ?, FALSE)',
        [user.id, ipAddress, userAgent]
      );

      return res.status(403).json({ message: 'Account is blocked' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      // Log failed login attempt
      const ipAddress = req.ip || req.connection.remoteAddress || req.socket.remoteAddress || 'unknown';
      const userAgent = req.get('User-Agent') || 'unknown';

      await db.promise().query(
        'INSERT INTO login_logs (userId, ipAddress, userAgent, success) VALUES (?, ?, ?, FALSE)',
        [user.id, ipAddress, userAgent]
      );

      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Update last login timestamp
    await db.promise().query(
      'UPDATE users SET lastLogin = CURRENT_TIMESTAMP WHERE id = ?',
      [user.id]
    );

    // Log the login event (record all login attempts, successful or failed)
    const ipAddress = req.ip || req.connection.remoteAddress || req.socket.remoteAddress || 'unknown';
    const userAgent = req.get('User-Agent') || 'unknown';

    await db.promise().query(
      'INSERT INTO login_logs (userId, ipAddress, userAgent, success) VALUES (?, ?, ?, TRUE)',
      [user.id, ipAddress, userAgent]
    );

    // Fetch updated user data with login count
    const [updatedUsers] = await db.promise().query(
      `SELECT
        u.id,
        u.username,
        u.email,
        u.firstName,
        u.lastName,
        u.phone,
        u.address,
        u.role,
        DATE_FORMAT(u.createdAt, "%Y-%m-%d %H:%i:%s") as createdAt,
        DATE_FORMAT(u.lastLogin, "%Y-%m-%d %H:%i:%s") as lastLogin,
        u.isBlocked,
        COUNT(ll.id) as loginCount
      FROM users u
      LEFT JOIN login_logs ll ON u.id = ll.userId AND ll.success = TRUE
      WHERE u.id = ?
      GROUP BY u.id`,
      [user.id]
    );

    const updatedUser = updatedUsers[0];

    const token = jwt.sign(
      { id: updatedUser.id, username: updatedUser.username, role: updatedUser.role },
      JWT_SECRET,
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      { id: updatedUser.id, username: updatedUser.username, role: updatedUser.role },
      JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      refreshToken,
      user: updatedUser
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Refresh token endpoint
exports.refreshToken = (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) return res.status(401).json({ message: 'Refresh token missing' });

  jwt.verify(refreshToken, JWT_REFRESH_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid refresh token' });

    const newToken = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '15m' }
    );

    res.json({ token: newToken });
  });
};

// Get all users (admin only) - Shows all users except hidden ones
exports.getAllUsers = async (req, res) => {
  try {
    const [users] = await db.promise().query(
      `SELECT
        u.id,
        u.username,
        u.email,
        u.firstName,
        u.lastName,
        u.phone,
        u.address,
        u.role,
        DATE_FORMAT(u.createdAt, "%Y-%m-%d %H:%i:%s") as createdAt,
        DATE_FORMAT(u.lastLogin, "%Y-%m-%d %H:%i:%s") as lastLogin,
        u.isBlocked,
        COUNT(ll.id) as loginCount
      FROM users u
      LEFT JOIN login_logs ll ON u.id = ll.userId AND ll.success = TRUE
      WHERE (u.isHidden = FALSE OR u.isHidden IS NULL)
      GROUP BY u.id
      ORDER BY u.lastLogin DESC, u.createdAt DESC`
    );

    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get current user profile
exports.getProfile = async (req, res) => {
  try {
    const [users] = await db.promise().query(
      `SELECT
        u.id,
        u.username,
        u.email,
        u.firstName,
        u.lastName,
        u.phone,
        u.address,
        u.role,
        DATE_FORMAT(u.createdAt, "%Y-%m-%d %H:%i:%s") as createdAt,
        DATE_FORMAT(u.lastLogin, "%Y-%m-%d %H:%i:%s") as lastLogin,
        u.isBlocked,
        COUNT(ll.id) as loginCount
      FROM users u
      LEFT JOIN login_logs ll ON u.id = ll.userId AND ll.success = TRUE
      WHERE u.id = ?
      GROUP BY u.id`,
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(users[0]);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update user profile - Users can only update their own profile
exports.updateProfile = async (req, res) => {
  const { firstName, lastName, username, email, phone, address } = req.body;

  try {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    const phoneRegex = /^09\d{9}$/;
    if (phone && !phoneRegex.test(phone)) {
      return res.status(400).json({ message: 'Phone number must be in Philippine format (starts with 09, exactly 11 digits)' });
    }

    // Check if new username/email is already taken by another user
    const [existingUsers] = await db.promise().query(
      'SELECT id FROM users WHERE (username = ? OR email = ?) AND id != ?',
      [username, email, req.user.id]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({ message: 'Username or email already exists' });
    }

    // Users can only update their own profile - no role changes
    await db.promise().query(
      'UPDATE users SET firstName = ?, lastName = ?, username = ?, email = ?, phone = ?, address = ? WHERE id = ?',
      [firstName, lastName, username, email, phone, address, req.user.id]
    );

    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Change password - Users can only change their own password
exports.changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  try {
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    const [users] = await db.promise().query(
      'SELECT username, email, firstName, lastName FROM users WHERE id = ?',
      [req.user.id]
    );
    const user = users[0];

    const personalInfo = [user.username, user.email, user.firstName, user.lastName].filter(Boolean);
    const containsPersonalInfo = personalInfo.some(info =>
      newPassword.toLowerCase().includes(info.toLowerCase())
    );

    if (containsPersonalInfo) {
      return res.status(400).json({ message: 'Password should not contain personal information such as username, email, or name' });
    }

    const [passwordUsers] = await db.promise().query(
      'SELECT password FROM users WHERE id = ?',
      [req.user.id]
    );
    const passwordUser = passwordUsers[0];

    const isValidPassword = await bcrypt.compare(currentPassword, passwordUser.password);
    if (!isValidPassword) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await db.promise().query(
      'UPDATE users SET password = ? WHERE id = ?',
      [hashedPassword, req.user.id]
    );

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Block user (admin only) - Only non-admin users can be blocked
exports.blockUser = async (req, res) => {
  const { userId } = req.params;

  try {
    // Prevent admin from blocking themselves
    if (req.user.id == userId) {
      return res.status(403).json({ message: 'You cannot block your own account' });
    }

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

    await db.promise().query('UPDATE users SET isBlocked = TRUE WHERE id = ?', [userId]);
    res.json({ message: 'User blocked successfully' });
  } catch (error) {
    console.error('Block user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Unblock user (admin only) - Only non-admin users can be unblocked
exports.unblockUser = async (req, res) => {
  const { userId } = req.params;

  try {
    const [users] = await db.promise().query(
      'SELECT role FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (users[0].role === 'Administrator') {
      return res.status(403).json({ message: 'Cannot unblock administrator accounts' });
    }

    await db.promise().query('UPDATE users SET isBlocked = FALSE WHERE id = ?', [userId]);
    res.json({ message: 'User unblocked successfully' });
  } catch (error) {
    console.error('Unblock user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Hide user (admin only) - Only non-admin users can be hidden
exports.hideUser = async (req, res) => {
  const { userId } = req.params;

  try {
    // Prevent admin from hiding themselves
    if (req.user.id == userId) {
      return res.status(403).json({ message: 'You cannot hide your own account' });
    }

    const [users] = await db.promise().query(
      'SELECT id, role FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = users[0];

    if (user.role === 'Administrator') {
      return res.status(403).json({ message: 'Cannot hide administrator accounts' });
    }

    await db.promise().query(
      'UPDATE users SET isHidden = TRUE WHERE id = ?',
      [userId]
    );

    res.json({ message: 'User hidden successfully' });
  } catch (error) {
    console.error('Hide user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};