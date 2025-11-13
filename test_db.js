const db = require('./joy-water-station-main/joy-water-station/backend/db');

async function testDB() {
  try {
    const [rows] = await db.promise().query('SELECT * FROM users');
    console.log('Users:', rows);
  } catch (error) {
    console.error('Error:', error);
  }
}

testDB();
