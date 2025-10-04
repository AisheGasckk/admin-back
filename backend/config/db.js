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
  // ADD TIMEOUT CONFIGURATIONS TO PREVENT ETIMEDOUT
  connectTimeout: 60000,     // 60 seconds to establish connection
  acquireTimeout: 60000,     // 60 seconds to get connection from pool
  timeout: 60000,            // 60 seconds for query execution
  // ADD RECONNECTION LOGIC
  reconnect: true,
  idleTimeout: 300000,       // 5 minutes idle timeout
  // ADD SSL CONFIGURATION (might be required by your host)
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  debug: process.env.NODE_ENV === 'development'
});

const promisePool = pool.promise();

const testConnection = async (retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      console.log(`🔄 Testing database connection (attempt ${i + 1}/${retries})...`);
      const [result] = await promisePool.query('SELECT 1');
      console.log('✅ MySQL Connected successfully');
      return true;
    } catch (err) {
      console.error(`❌ MySQL Connection attempt ${i + 1} failed:`, err.message);
      console.error(`Error code: ${err.code}, Error number: ${err.errno}`);
      
      if (i === retries - 1) {
        console.error('❌ All database connection attempts failed');
        console.error('💡 Check: 1) Database server status 2) Network connectivity 3) Credentials 4) Firewall settings');
        return false;
      }
      
      // Wait 5 seconds before retry
      console.log(`⏳ Waiting 5 seconds before retry...`);
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
};

// Query wrapper with retry logic for ETIMEDOUT errors
const executeQuery = async (query, params = [], retries = 2) => {
  for (let i = 0; i < retries; i++) {
    try {
      return await promisePool.query(query, params);
    } catch (error) {
      console.error(`Query attempt ${i + 1} failed:`, error.message);
      
      // Retry only for timeout errors
      if (error.code === 'ETIMEDOUT' && i < retries - 1) {
        console.log(`🔄 Retrying query due to timeout... (${i + 1}/${retries})`);
        await new Promise(resolve => setTimeout(resolve, 2000));
        continue;
      }
      
      // Re-throw the error if not retryable or max retries reached
      throw error;
    }
  }
};

module.exports = { 
  pool: promisePool, 
  testConnection,
  executeQuery
};
