const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'cps_management',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

async function testConnection() {
  try {
    const [rows] = await pool.query('SELECT 1 AS ok');
    if (rows[0]?.ok === 1) {
      console.log('MySQL connection established.');
    }
  } catch (error) {
    console.error('MySQL connection failed:', error.message);
  }
}

module.exports = { pool, testConnection };
