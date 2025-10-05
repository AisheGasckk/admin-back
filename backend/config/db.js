const mysql = require('mysql2');
const dotenv = require('dotenv');
const path = require('path');

// Load .env file only in development
if (process.env.NODE_ENV !== 'production') {
  dotenv.config({ path: path.join(__dirname, '../.env') });
}

// Add debug logging
console.log('Database Config:', {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  database: process.env.DB_NAME,
  // Don't log password for security
});

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 60000,
  acquireTimeout: 60000,
  timeout: 60000,
  reconnect: true,
  idleTimeout: 300000,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  debug: process.env.NODE_ENV === 'development'
});

const promisePool = pool.promise();

const testConnection = async (retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      console.log(`🔄 Testing database connection (attempt ${i + 1}/${retries})...`);
      console.log(`Connecting to: ${process.env.DB_HOST}:${process.env.DB_PORT}`);
      
      const [result] = await promisePool.query('SELECT 1');
      console.log('✅ MySQL Connected successfully');
      return true;
    } catch (err) {
      console.error(`❌ MySQL Connection attempt ${i + 1} failed:`, err.message);
      console.error(`Error code: ${err.code}, Error number: ${err.errno}`);
      
      if (i === retries - 1) {
        console.error('❌ All database connection attempts failed');
        console.error('Environment check:', {
          DB_HOST: process.env.DB_HOST || 'MISSING',
          DB_PORT: process.env.DB_PORT || 'MISSING',
          DB_USER: process.env.DB_USER || 'MISSING',
          DB_NAME: process.env.DB_NAME || 'MISSING'
        });
        return false;
      }
      
      console.log(`⏳ Waiting 5 seconds before retry...`);
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
};

const executeQuery = async (query, params = [], retries = 2) => {
  for (let i = 0; i < retries; i++) {
    try {
      return await promisePool.query(query, params);
    } catch (error) {
      console.error(`Query attempt ${i + 1} failed:`, error.message);
      
      if (error.code === 'ETIMEDOUT' && i < retries - 1) {
        console.log(`🔄 Retrying query due to timeout... (${i + 1}/${retries})`);
        await new Promise(resolve => setTimeout(resolve, 2000));
        continue;
      }
      
      throw error;
    }
  }
};

module.exports = { 
  pool: promisePool, 
  testConnection,
  executeQuery
};
