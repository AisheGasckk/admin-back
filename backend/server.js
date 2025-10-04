const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const { testConnection } = require('./config/db');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const pool = require('./config/db').pool;

// Load environment variables
dotenv.config();

const app = express();

// CORS configuration
const allowedOrigins = process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ['http://localhost:3001', 'http://localhost:3000'];
app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
}));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
  next();
});

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
const departmentRoutes = require('../../department/backend/route/deptroute');
const officeRoutes = require('../../office/backend/route/officeRoute');
const officedeptRoutes = require('../../office/backend/route/officedeptRoutes');
const departmentUserRoutes = require('./adminbackend/route/departmentUserRoutes');
const officeUserRoutes = require('./adminbackend/route/officeuserroutes');
const principleRoutes = require('../../principle/backend/route/principleroute');
const submittedUserRoutes = require('./adminbackend/route/submittedUserRoutes');
const templateRoutes = require('../../Admin-Frontend/template/routes/templateRoutes'); 

// Use routes with proper path prefix
app.use('/api', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/department-user', departmentUserRoutes);
app.use('/api/office-user', officeUserRoutes);
app.use('/api', departmentRoutes);
app.use('/api/office', officeRoutes);
// mount the officedept sub-router so frontend calls like /api/office/officedept/create work
app.use('/api/office/officedept', officedeptRoutes);
app.use('/api/principle', principleRoutes);
app.use('/api/submitted-data', submittedUserRoutes);
app.use('/api/template', templateRoutes);


// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
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

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username and password are required' });
    }

    // Fetch user from database
    const [user] = await pool.query('SELECT * FROM admin WHERE username = ?', [username]);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });

    res.json({ success: true, token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
