require('dotenv').config();

const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const userRoutes = require('./routes/userRoutes');
const customerRoutes = require('./routes/customerRoutes');
const itemRoutes = require('./routes/itemRoutes');
const productRoutes = require('./routes/productRoutes');
const salesRoutes = require('./routes/salesRoutes');
const db = require('./db');


const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/users', userRoutes);

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

// Seed admin user if not exists
const seedAdminUser = async () => {
  try {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await db.promise().query(
      'INSERT INTO users (username, email, password, firstName, lastName, phone, address, role) VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE password = VALUES(password), role = VALUES(role)',
      ['admin', 'admin@joywater.com', hashedPassword, 'Sarah', 'Admin', '09123456789', 'Davao City', 'Administrator']
    );
    console.log('Admin user seeded successfully');
  } catch (error) {
    console.error('Error seeding admin user:', error.message);
  }
};

// Call seed function after DB connection
db.getConnection((err, connection) => {
  if (err) {
    console.error('Database connection failed:', err.message || err);
    if (err.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('-> Access denied for DB user. Check backend/.env DB_USER and DB_PASSWORD.');
      console.error('   Try: mysql -u ' + (process.env.DB_USER || 'root') + ' -p  (enter your password) to verify credentials.');
      console.error('   If password is unknown, follow MySQL recovery steps (start with --skip-grant-tables) to reset it.');
    } else if (err.code === 'ECONNREFUSED') {
      console.error('-> Connection refused. Is MySQL server running? Start the MySQL service (run as Administrator).');
    } else {
      console.error('-> MySQL error code:', err.code);
    }
    // don't throw so server can start for local UI/fallback behavior
    return;
  }
  console.log('Successfully connected to the database.');
  seedAdminUser(); // Seed admin after successful connection
  connection.release();
});

// Routes
app.use('/api/users', userRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/products', productRoutes);
app.use('/api/sales', salesRoutes);

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something broke!' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
