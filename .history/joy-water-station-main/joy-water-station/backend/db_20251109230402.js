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

// Test connection once at startup and print actionable hints on failure
pool.getConnection((err, connection) => {
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
  connection.release();
});

// Optional: log unexpected pool errors
pool.on('error', (err) => {
  console.error('Unexpected database error:', err);
});

module.exports = pool;
