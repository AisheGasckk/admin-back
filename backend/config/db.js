const mysql = require('mysql2');
const dotenv = require('dotenv');
const path = require('path');

// Load env from backend/.env
dotenv.config({ path: path.join(__dirname, '../.env') });

// In production, require DB env vars and fail fast to avoid 127.0.0.1 fallback on Render
if (process.env.NODE_ENV === 'production') {
  const required = ['DB_HOST', 'DB_USER', 'DB_PASS', 'DB_NAME'];
  const missing = required.filter((k) => !process.env[k]);
  if (missing.length) {
    console.error('Missing DB env vars:', missing.join(', '));
    console.error('Refusing to start without required DB configuration in production.');
    process.exit(1);
  }
}

const effectiveHost = process.env.DB_HOST || '127.0.0.1';
if (process.env.NODE_ENV !== 'production') {
  console.log(`[DB] Using host: ${effectiveHost}`);
}

const pool = mysql.createPool({
  host: effectiveHost,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: Number(process.env.DB_CONNECTION_LIMIT || 10),
  queueLimit: 0,
  connectTimeout: Number(process.env.DB_CONNECT_TIMEOUT || 20000),
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  ssl: process.env.DB_SSL === 'true'
    ? {
        rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false',
        minVersion: 'TLSv1.2',
        ca: process.env.DB_SSL_CA || undefined,
      }
    : undefined,
  debug: process.env.NODE_ENV === 'development',
});

const promisePool = pool.promise();

const testConnection = async (retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      console.log(`🔄 Testing database connection (attempt ${i + 1}/${retries})...`);
      await promisePool.query('SELECT 1');
      console.log('✅ MySQL Connected successfully');
      return true;
    } catch (err) {
      console.error(`❌ MySQL Connection attempt ${i + 1} failed:`, err.message);
      console.error(`Error code: ${err.code}, Error number: ${err.errno}`);
      if (i === retries - 1) {
        console.error('❌ All database connection attempts failed');
        console.error('💡 Check: 1) Database server status 2) Network connectivity 3) Credentials 4) Firewall/SSL settings');
        return false;
      }
      console.log(`⏳ Waiting 5 seconds before retry...`);
      await new Promise((resolve) => setTimeout(resolve, 5000));
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
      if (error.code === 'ETIMEDOUT' && i < retries - 1) {
        console.log(`🔄 Retrying query due to timeout... (${i + 1}/${retries})`);
        await new Promise((resolve) => setTimeout(resolve, 2000));
        continue;
      }
      throw error;
    }
  }
};

module.exports = {
  pool: promisePool,
  testConnection,
  executeQuery,
};
