const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const { testConnection } = require('./config/db');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const pool = require('./config/db').pool;

// Load environment variables only in development
if (process.env.NODE_ENV !== 'production') {
  dotenv.config();
}

const app = express();

// CORS configuration
const allowedOrigins = process.env.CORS_ORIGIN ? 
  process.env.CORS_ORIGIN.split(',') : 
  [
    'http://localhost:3001', 
    'http://localhost:3000',
    'https://aishegasckk.in',
    'https://www.aishegasckk.in'
  ];

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
}));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Maintenance gate (skip health and admin maintenance endpoints)
let maintenanceCache = { enabled: false, message: '', ts: 0 };
app.use(async (req, res, next) => {
  try {
    if (req.path === '/health' || req.path.startsWith('/api/admin/maintenance')) {
      return next();
    }
    const now = Date.now();
    if (now - maintenanceCache.ts > 15000) {
      const [rows] = await pool.query(
        "SELECT name, value FROM app_settings WHERE name IN ('maintenance_mode','maintenance_message')"
      );
      const map = Object.fromEntries(rows.map(r => [r.name, r.value]));
      maintenanceCache = {
        enabled: map.maintenance_mode === '1' || map.maintenance_mode === 'true',
        message: map.maintenance_message || '',
        ts: now
      };
    }
    if (maintenanceCache.enabled) {
      return res.status(503).json({
        success: false,
        maintenance: true,
        message: maintenanceCache.message || 'Service is under maintenance'
      });
    }
  } catch (e) {
    // fail-open
  }
  next();
});

// Request logging middleware (only in development)
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    // Skip logging health checks to reduce noise
    if (req.url !== '/health') {
      console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
    }
    next();
  });
}

// Middleware to verify JWT token
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'No token provided' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

// Import routes
const authRoutes = require('./routes/auth');
const adminRoutes = require('./adminbackend/route/adminRoutes');
const departmentRoutes = require('./dept-backend/route/deptroute');
const departmentUserRoutes = require('./adminbackend/route/departmentUserRoutes');
const officeUserRoutes = require('./adminbackend/route/officeuserroutes');
const submittedUserRoutes = require('./adminbackend/route/submittedUserRoutes');
// Office backend routes
const officeRoutes = require('./office-backend/route/officeRoute');
const officeDeptRoutes = require('./office-backend/route/officedeptRoutes');
// ADD PRINCIPLE BACKEND ROUTES
const principleRoutes = require('./principle-backend/route/principleroute');
// Import template routes - CORRECT PATH
const templateRoutes = require('./template-backend/routes/templateRoutes');

// Use routes properly - Order matters! Most specific routes first
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/department-user', departmentUserRoutes);
app.use('/api/office-user', officeUserRoutes);
app.use('/api/submitted-data', submittedUserRoutes);

// Office backend routes
app.use('/api/office', officeRoutes);
app.use('/api/office/officedept', officeDeptRoutes);

// ADD PRINCIPLE ROUTES
app.use('/api/principle', principleRoutes);
// Add template routes
app.use('/api/template', templateRoutes);

// Add backward compatibility route for direct /api/login
const { login, forgotPassword, verifyOtp, resetPassword } = require('./controllers/authController');
app.post('/api/login', login);
app.post('/api/forgot-password', forgotPassword);
app.post('/api/verify-otp', verifyOtp);
app.post('/api/reset-password', resetPassword);

// Department routes - use specific prefix instead of catch-all
app.use('/api/department', departmentRoutes);

// Health check endpoint (for hosting platform)
app.get('/health', async (req, res) => {
  try {
    // Test database connection
    await pool.query('SELECT 1');
    res.status(200).json({ 
      status: 'OK', 
      timestamp: new Date().toISOString(),
      database: 'Connected'
    });
  } catch (error) {
    res.status(503).json({ 
      status: 'ERROR', 
      timestamp: new Date().toISOString(),
      database: 'Disconnected'
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});

const PORT = process.env.PORT || 5000;

// Start server
const startServer = async () => {
  try {
    await testConnection();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
};

startServer();
