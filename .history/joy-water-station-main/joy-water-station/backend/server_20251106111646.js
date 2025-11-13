const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const userRoutes = require('./routes/userRoutes');
const itemRoutes = require('./routes/itemRoutes');
const db = require('./db');

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend is running' });
});

// New: DB status endpoint
app.get('/api/db-status', (req, res) => {
  db.getConnection((err, connection) => {
    if (err) {
      return res.status(500).json({ ok: false, message: 'DB connection failed', error: err.message });
    }
    const info = {
      ok: true,
      threadId: connection.threadId || null,
      database: process.env.DB_NAME || null
    };
    connection.release();
    res.json(info);
  });
});

// Routes
app.use('/api/users', userRoutes);
app.use('/api/items', itemRoutes);

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something broke!' });
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
