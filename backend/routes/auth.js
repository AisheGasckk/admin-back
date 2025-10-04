const express = require('express');
const router = express.Router();
const { login, forgotPassword, verifyOtp, resetPassword } = require('../controllers/authController');

// Debug middleware
router.use((req, res, next) => {
  console.log(`Auth Route: ${req.method} ${req.originalUrl}`);
  next();
});

// Auth routes
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/verify-otp', verifyOtp);
router.post('/reset-password', resetPassword);

module.exports = router;
