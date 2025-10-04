const { pool } = require('../config/db');
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Update the createTransporter function
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    tls: {
      rejectUnauthorized: false
    }
  });
};

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required'
      });
    }

    // Get user from database
    const [rows] = await pool.query(
      'SELECT * FROM admin WHERE username = ?',
      [username]
    );

    if (rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password'
      });
    }

    const user = rows[0];

    // Use bcrypt.compare to check password
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'An error occurred during login'
    });
  }
};

// Send OTP to admin email (email only)
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email is required' });

    const [rows] = await pool.query('SELECT * FROM admin WHERE email = ?', [email.trim().toLowerCase()]);
    const user = rows[0];
    if (!user) return res.status(404).json({ success: false, message: 'No account found' });

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiryTime = new Date(Date.now() + 10 * 60 * 1000);

    await pool.query('INSERT INTO password_resets (email, otp, expires_at, used) VALUES (?, ?, ?, 0)', [email, otp, expiryTime]);

    // Mask email for UI
    const maskedEmail = email.replace(/(.{2})(.*)(@.*)/, '$1***$3');

    // Send OTP email (branded layout)
    const transporter = createTransporter();
    await transporter.sendMail({
      from: `"GASCKK AISHE PORTAL" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'GASCKK AISHE PORTAL - Password Reset Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width:700px;margin:0 auto;padding:20px;background:#f7fafc;border-radius:8px;">
          <header style="text-align:center;margin-bottom:18px;">
            <h1 style="margin:0;color:#0b3b64">GASCKK AISHE PORTAL</h1>
            <p style="margin:4px 0 0;color:#475569;font-size:14px">Password reset request</p>
          </header>
          <main style="background:white;padding:20px;border-radius:6px;text-align:center;">
            <p style="color:#334155;margin:0 0 12px;">Use the code below to reset your password. It expires in 10 minutes.</p>
            <div style="display:inline-block;padding:18px 28px;border-radius:8px;background:#eef2ff;color:#1e3a8a;font-size:28px;letter-spacing:6px;">
              ${otp}
            </div>
            <p style="color:#64748b;margin-top:14px;font-size:13px;">If you didn't request this, ignore this email or contact admin.</p>
          </main>
          <footer style="text-align:center;margin-top:14px;font-size:12px;color:#94a3b8;">
            © GASCKK AISHE PORTAL
          </footer>
        </div>
      `
    });

    res.json({ success: true, message: 'Reset code sent successfully', maskedEmail });
  } catch (error) {
    console.error('forgotPassword error:', error);
    res.status(500).json({ success: false, message: 'Failed to send reset code' });
  }
};

// Verify OTP: Checks if OTP is valid but does NOT mark it as used
exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ success: false, message: 'Email and OTP are required' });

    const [rows] = await pool.query(
      'SELECT id FROM password_resets WHERE email = ? AND otp = ? AND used = 0 AND expires_at > NOW() ORDER BY id DESC LIMIT 1',
      [email.trim().toLowerCase(), otp.trim()]
    );
    if (rows.length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    // OTP is valid, allow frontend to proceed. DO NOT mark as used here.
    res.json({ success: true, message: 'OTP verified' });
  } catch (error) {
    console.error('verifyOtp error:', error);
    res.status(500).json({ success: false, message: 'Failed to verify OTP' });
  }
};

// Reset password: Re-verifies OTP, resets password, THEN marks OTP as used
exports.resetPassword = async (req, res) => {
  try {
    let { email, otp, newPassword } = req.body;
    email = email ? String(email).trim().toLowerCase() : '';
    otp = otp ? String(otp).trim() : '';
    newPassword = newPassword ? String(newPassword) : '';

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ success: false, message: 'Email, OTP and new password are required' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters' });
    }

    // Re-verify the OTP to ensure it's still valid and unused
    const [rows] = await pool.query(
      'SELECT id FROM password_resets WHERE email = ? AND otp = ? AND used = 0 AND expires_at > NOW() ORDER BY id DESC LIMIT 1',
      [email, otp]
    );
    if (rows.length === 0) {
      return res.status(400).json({ success: false, message: 'OTP not verified or expired. Please request a new one.' });
    }
    const resetId = rows[0].id;

    // Update password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const [result] = await pool.query('UPDATE admin SET password = ? WHERE email = ?', [hashedPassword, email]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Account not found' });
    }

    // NOW, mark the OTP as used so it cannot be reused
    await pool.query('UPDATE password_resets SET used = 1 WHERE id = ?', [resetId]);

    // Get username for confirmation email
    const [userRows] = await pool.query('SELECT username, name FROM admin WHERE email = ?', [email]);
    const user = userRows[0] || {};

    // Send confirmation email
    const transporter = createTransporter();
    await transporter.sendMail({
      from: `"GASCKK AISHE PORTAL" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'GASCKK AISHE PORTAL - Password Changed',
      html: `
        <div style="font-family: Arial, sans-serif; max-width:700px;margin:0 auto;padding:20px;background:#f7fafc;border-radius:8px;">
          <header style="text-align:center;margin-bottom:18px;">
            <h1 style="margin:0;color:#0b3b64">GASCKK AISHE PORTAL</h1>
            <p style="margin:4px 0 0;color:#475569;font-size:14px">Password change confirmation</p>
          </header>
          <main style="background:white;padding:20px;border-radius:6px;">
            <p style="color:#334155;">Hello ${user.name || user.username},</p>
            <p style="color:#334155;">Your password has been changed successfully.</p>
            <div style="background:#f1f5f9;padding:12px;border-radius:6px;margin:12px 0;">
              <p style="margin:0;font-size:13px"><strong>Username:</strong> ${user.username}</p>
              <p style="margin:0;font-size:13px"><strong>New Password:</strong> ${newPassword}</p>
            </div>
            <p style="color:#64748b;font-size:13px;">If you did not request this change, contact the administrator immediately.</p>
          </main>
          <footer style="text-align:center;margin-top:14px;font-size:12px;color:#94a3b8;">
            © GASCKK AISHE PORTAL
          </footer>
        </div>
      `
    });

    res.json({ success: true, message: 'Password reset successfully. Confirmation email sent.' });
  } catch (error) {
    console.error('resetPassword error:', error);
    res.status(500).json({ success: false, message: 'Failed to reset password' });
  }
};
