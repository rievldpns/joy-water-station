const jwt = require('jsonwebtoken');

// Fallback secrets if .env is not loaded (CHANGE THESE IN PRODUCTION!)
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key_here';

exports.authenticate = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

exports.authorizeAdmin = (req, res, next) => {
  if (req.user.role !== 'Administrator') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};
