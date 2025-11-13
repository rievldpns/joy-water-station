const db = require('../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Register new user
exports.register = async (req, res) => {
  const { username, email, password, firstName, lastName, phone, address } = req.body;

  try {
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    // Validate Philippine phone number format (starts with 09, exactly 11 digits)
    const phoneRegex = /^09\d{9}$/;
    if (phone && !phoneRegex.test(phone)) {
      return res.status(400).json({ message: 'Phone number must be in Philippine format (starts with 09, exactly 11 digits)' });
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
      'INSERT INTO users (username, email, password, firstName, lastName, phone, address) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [username, email, hashedPassword, firstName, lastName, phone, address]
    );

    // Fetch the newly created user
    const [users] = await db.promise().query(
      'SELECT id, username, email, firstName, lastName, phone, address, role, createdAt, lastLogin, isBlocked FROM users WHERE id = ?',
      [result.insertId]
    );

    const user = users[0];

    // Generate JWT token and refresh token
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_REFRESH_SECRET,
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
    // Find user by username or email
    const [users] = await db.promise().query(
      'SELECT * FROM users WHERE username = ? OR email = ?',
      [username, username]
    );

    if (users.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = users[0];

    // Check if user is blocked
    if (user.isBlocked) {
      return res.status(403).json({ message: 'Account is blocked' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Update last login
    await db.promise().query(
      'UPDATE users SET lastLogin = CURRENT_TIMESTAMP WHERE id = ?',
      [user.id]
    );

    // Generate JWT token and refresh token
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      message: 'Login successful',
      token,
      refreshToken,
      user: userWithoutPassword
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

  jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid refresh token' });

    const newToken = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    res.json({ token: newToken });
  });
};

// Get all users (admin only)
exports.getAllUsers = async (req, res) => {
  try {
    // Exclude hidden users from the list
    const [users] = await db.promise().query(
      'SELECT id, username, email, firstName, lastName, phone, address, role, createdAt, lastLogin, isBlocked FROM users WHERE isHidden = FALSE OR isHidden IS NULL ORDER BY createdAt DESC'
    );

    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get user profile
exports.getProfile = async (req, res) => {
  try {
    const [users] = await db.promise().query(
      'SELECT id, username, email, firstName, lastName, phone, address, role, createdAt, lastLogin, isBlocked FROM users WHERE id = ?',
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

// Update user profile
exports.updateProfile = async (req, res) => {
  const { firstName, lastName, username, email, phone, address } = req.body;

  try {
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    // Validate Philippine phone number format (starts with 09, exactly 11 digits)
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

// Change password
exports.changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  try {
    // Validate password strength
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    // Get current user for personal information check
    const [users] = await db.promise().query('SELECT username, email, firstName, lastName FROM users WHERE id = ?', [req.user.id]);
    const user = users[0];

    // Check if password contains personal information
    const personalInfo = [user.username, user.email, user.firstName, user.lastName].filter(Boolean);
    const containsPersonalInfo = personalInfo.some(info =>
      newPassword.toLowerCase().includes(info.toLowerCase())
    );

    if (containsPersonalInfo) {
      return res.status(400).json({ message: 'Password should not contain personal information such as username, email, or name' });
    }

    // Get current user password
    const [passwordUsers] = await db.promise().query('SELECT password FROM users WHERE id = ?', [req.user.id]);
    const passwordUser = passwordUsers[0];

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, passwordUser.password);
    if (!isValidPassword) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await db.promise().query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, req.user.id]);

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Block user (admin only)
exports.blockUser = async (req, res) => {
  const { userId } = req.params;

  try {
    await db.promise().query('UPDATE users SET isBlocked = TRUE WHERE id = ?', [userId]);
    res.json({ message: 'User blocked successfully' });
  } catch (error) {
    console.error('Block user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Unblock user (admin only)
exports.unblockUser = async (req, res) => {
  const { userId } = req.params;

  try {
    await db.promise().query('UPDATE users SET isBlocked = FALSE WHERE id = ?', [userId]);
    res.json({ message: 'User unblocked successfully' });
  } catch (error) {
    console.error('Unblock user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
