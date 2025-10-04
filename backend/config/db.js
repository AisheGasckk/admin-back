const mysql = require('mysql2');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'auth-db1988.hostgr.io',
  port: parseInt(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'u527515383_aishegasckk',
  password: process.env.DB_PASS || 'Aishegasckk_03',
  database: process.env.DB_NAME || 'u527515383_aishe',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  debug: process.env.NODE_ENV === 'development'
});

const promisePool = pool.promise();

const testConnection = async () => {
  try {
    const [result] = await promisePool.query('SELECT 1');
    console.log('✅ MySQL Connected successfully');
    return true;
  } catch (err) {
    console.error('❌ MySQL Connection error:', err.message);
    return false;
  }
};

module.exports = { pool: promisePool, testConnection };
