const { pool } = require('../../../Admin/backend/config/db');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');

// Create email transporter function
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });
};

// Office forgot password controller
exports.forgotOfficePassword = async (req, res) => {
  try {
    const emailRaw = req.body.email;
    if (!emailRaw) return res.status(400).json({ success: false, message: 'Email is required' });
    const email = String(emailRaw).trim().toLowerCase();

    const [rows] = await pool.query('SELECT * FROM office_users WHERE email = ?', [email]);
    const user = rows[0];
    if (!user) return res.status(404).json({ success: false, message: 'No account found' });

    // generate otp and expiry
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiryTime = new Date(Date.now() + 10 * 60 * 1000);

    // insert into password_resets
    await pool.query('INSERT INTO password_resets (email, otp, expires_at, used) VALUES (?, ?, ?, 0)', [email, otp, expiryTime]);

    const maskedEmail = email.replace(/(.{2})(.*)(@.*)/, '$1***$3');

    // send OTP email
    const transporter = createTransporter();
    await transporter.sendMail({
      from: `"GASCKK AISHE PORTAL" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: 'GASCKK AISHE PORTAL - Password Reset Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1a365d;">Password Reset Code</h2>
          <p>Your verification code is:</p>
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
            <h1 style="color: #1a365d; letter-spacing: 5px; font-size: 32px; margin: 0;">${otp}</h1>
          </div>
          <p>This code will expire in 10 minutes.</p>
        </div>
      `
    });

    res.json({ success: true, message: 'Reset code sent successfully', maskedEmail });
  } catch (error) {
    console.error('forgotOfficePassword error:', error);
    res.status(500).json({ success: false, message: 'Failed to send reset code' });
  }
};

// Step 2: Verify OTP (do not mark used)
exports.verifyOfficeOtp = async (req, res) => {
  try {
    const emailRaw = req.body.email;
    const otpRaw = req.body.otp;
    if (!emailRaw || !otpRaw) return res.status(400).json({ success: false, message: 'Email and OTP are required' });
    const email = String(emailRaw).trim().toLowerCase();
    const otp = String(otpRaw).trim();

    // Optional: log for debugging
    console.log('verifyOfficeOtp request:', { email, otp });

    const [resets] = await pool.query(
      'SELECT * FROM password_resets WHERE email = ? AND otp = ? AND expires_at > NOW() AND used = 0',
      [email, otp]
    );
    if (resets.length === 0) return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });

    res.json({ success: true, message: 'OTP verified successfully' });
  } catch (error) {
    console.error('verifyOfficeOtp error:', error);
    res.status(500).json({ success: false, message: 'Failed to verify OTP' });
  }
};

// Step 3: Reset password
exports.resetOfficePassword = async (req, res) => {
  try {
    let { email, otp, newPassword } = req.body;
    email = email ? String(email).trim().toLowerCase() : '';
    otp = otp ? String(otp).trim() : '';
    newPassword = newPassword ? String(newPassword) : '';

    if (!email || !otp || !newPassword) return res.status(400).json({ success: false, message: 'Email, OTP, and new password are required' });
    if (newPassword.length < 8) return res.status(400).json({ success: false, message: 'Password must be at least 8 characters' });

    const [userRows] = await pool.query('SELECT * FROM office_users WHERE email = ?', [email]);
    const user = userRows[0];
    if (!user) return res.status(404).json({ success: false, message: 'No account found' });

    const [resets] = await pool.query('SELECT * FROM password_resets WHERE email = ? AND otp = ? AND expires_at > NOW() AND used = 0', [email, otp]);
    if (resets.length === 0) return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE office_users SET password = ? WHERE email = ?', [hashedPassword, email]);

    const resetId = resets[0].id;
    await pool.query('UPDATE password_resets SET used = 1 WHERE id = ?', [resetId]);

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
            <p style="color:#334155;margin:0 0 12px;">Hello ${user.name || user.username || ''},</p>
            <p style="color:#334155;margin:0 0 12px;">Your password has been changed successfully.</p>
            <div style="background:#f1f5f9;padding:14px;border-radius:8px;margin-top:12px;">
              <p style="margin:0 0 6px;"><strong>Username:</strong> ${user.username || ''}</p>
              <p style="margin:0"><strong>New Password:</strong> ${newPassword}</p>
            </div>
            <p style="color:#64748b;margin-top:14px;font-size:13px;">If you did not request this change, contact the administrator immediately.</p>
          </main>
          <footer style="text-align:center;margin-top:14px;font-size:12px;color:#94a3b8;">
            © GASCKK AISHE PORTAL
          </footer>
        </div>
      `
    });

    res.json({ success: true, message: 'Password reset successfully. Confirmation email sent.' });
  } catch (error) {
    console.error('resetOfficePassword error:', error);
    res.status(500).json({ success: false, message: 'Failed to reset password' });
  }
};

exports.officeLogin = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username and password are required' });
    }
    const [rows] = await pool.query('SELECT * FROM office_users WHERE username = ?', [username]);
    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid username or password' });
    }
    const user = rows[0];
    if (user.locked) {
      return res.status(403).json({ success: false, message: 'Account locked by Nodel' });
    }
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ success: false, message: 'Invalid username or password' });
    }
    const token = jwt.sign(
      { id: user.id, username: user.username, office_id: user.office_id },
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
        email: user.email,
        office_id: user.office_id,
        name: user.name,
        academic_year: user.academic_year,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'An error occurred during login' });
  }
};