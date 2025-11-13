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

// Test database connection once at startup and provide clear guidance if it fails
pool.getConnection((err, connection) => {
  if (err) {
    console.error('Database connection failed:', err.message);
    if (err.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('-> Access denied for DB user. Please check DB_USER and DB_PASSWORD in backend/.env');
      console.error('-> To reset root password: run MySQL as admin and use ALTER USER ... IDENTIFIED BY ...; then FLUSH PRIVILEGES;');
    } else if (err.code === 'ECONNREFUSED') {
      console.error('-> Connection refused. Is MySQL server running? Start the MySQL service (run as Administrator).');
    } else {
      console.error('-> See MySQL error code:', err.code);
    }
    // don't throw here — allow server to run without DB for limited UI/debugging
    return;
  }
  console.log('Successfully connected to the database.');
  connection.release();
});

// Optional: handle unexpected errors on the pool
pool.on('error', (err) => {
  console.error('Unexpected database error:', err);
});

module.exports = pool;
