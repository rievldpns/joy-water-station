const mysql = require('mysql2');
const dotenv = require('dotenv');

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'joy_water_station',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test database connection once at startup with helpful messages
pool.getConnection((err, connection) => {
  if (err) {
    console.error('Database connection failed:', err.message);
    if (err.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('-> Access denied. Check DB_USER and DB_PASSWORD in backend/.env');
    } else if (err.code === 'ECONNREFUSED') {
      console.error('-> Connection refused. Is MySQL running? Start the MySQL service.');
    } else {
      console.error('-> MySQL error code:', err.code);
    }
    // Do not throw so server can still boot for debugging UI
    return;
  }
  console.log('Successfully connected to the database.');
  connection.release();
});

// Optional: listen for pool errors
pool.on('error', (err) => {
  console.error('Unexpected database error:', err);
});

module.exports = pool;
