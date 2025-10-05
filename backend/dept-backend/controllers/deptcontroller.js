const { pool } = require('../../config/db');
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

// Department forgot password controller (OTP only)
exports.forgotDepartmentPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }
    const [rows] = await pool.query('SELECT * FROM department_users WHERE email = ?', [email]);
    const user = rows[0];
    if (!user) {
      return res.status(404).json({ success: false, message: 'No account found' });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiryTime = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Save OTP to DB (implement your own password_resets table)
    await pool.query(
      'INSERT INTO password_resets (email, otp, expires_at, used) VALUES (?, ?, ?, 0)',
      [user.email, otp, expiryTime]
    );

    // Mask email for UI
    const maskedEmail = user.email.replace(/(.{2})(.*)(@.*)/, '$1***$3');

    // Send OTP email
    const transporter = createTransporter();
    // Send OTP with GASCKK branding
    await transporter.sendMail({
      from: `"GASCKK AISHE PORTAL" <${process.env.EMAIL_USER}>`,
      to: user.email,
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

    res.json({
      success: true,
      message: 'Reset code sent successfully',
      maskedEmail
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to send reset code' });
  }
};

// Department login controller
exports.departmentLogin = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username and password are required' });
    }
    const [rows] = await pool.query('SELECT * FROM department_users WHERE username = ?', [username]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'No account found' });
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
        email: user.email,
        department: user.department,
        dept_id: user.dept_id,
        name: user.name,
        academic_year: user.academic_year,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'An error occurred during login' });
  }
};

// Controller to get HOD name for a department
exports.getHodName = async (req, res) => {
  try {
    const { deptId } = req.params;
    if (!deptId) {
      return res.status(400).json({ success: false, message: 'Department ID is required' });
    }
    // Use the correct column name 'hod'
    const [rows] = await pool.query(
      'SELECT hod FROM department_users WHERE dept_id = ? ORDER BY academic_year DESC LIMIT 1',
      [deptId]
    );
    if (rows.length === 0 || !rows[0].hod) {
      return res.json({ success: false, hod_name: null, message: 'HOD name not found' });
    }
    res.json({ success: true, hod_name: rows[0].hod });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch HOD name', error: error.message });
  }
};

// Check if declaration is locked and submitted
// Enhanced: include degree_level for Student Examination
exports.getDeclarationLockStatus = async (req, res) => {
  try {
    const { deptId, year, type, degree_level } = req.query;
    if (!deptId || !year || !type || (type === 'Student Examination' && !degree_level)) {
      return res.status(400).json({ success: false, message: 'deptId, year, type, and degree_level are required' });
    }
    let query, params;
    if (type === 'Student Examination') {
      query = `SELECT locked FROM submitted_data WHERE dept_id = ? AND year = ? AND type = ? AND degree_level = ? ORDER BY submitted_at DESC LIMIT 1`;
      params = [deptId, year, type, degree_level];
    } else {
      query = `SELECT locked FROM submitted_data WHERE dept_id = ? AND year = ? AND type = ? ORDER BY submitted_at DESC LIMIT 1`;
      params = [deptId, year, type];
    }
    const [rows] = await pool.query(query, params);
    if (rows.length > 0 && rows[0].locked === 1) {
      return res.json({ success: true, locked: true });
    }
    res.json({ success: true, locked: false });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to check lock status', error: error.message });
  }
};

// Controller to get examination year statuses
exports.getExaminationYearStatuses = async (req, res) => {
  try {
    const { deptId } = req.params;
    const yearSlots = req.query.years ? req.query.years.split(',') : ['I Year', 'II Year', 'III Year'];
    if (!deptId) {
      return res.status(400).json({ success: false, message: 'Department ID is required' });
    }
    const [years] = await pool.query(
      `SELECT academic_year FROM department_users WHERE dept_id = ? ORDER BY academic_year DESC LIMIT 1`,
      [deptId]
    );
    const academicYear = years[0]?.academic_year;
    if (!academicYear) {
      return res.json({ success: false, statuses: [] });
    }
    const [rows] = await pool.query(
      `SELECT year, status FROM student_examination WHERE dept_id = ? AND academic_year = ?`,
      [deptId, academicYear]
    );
    const normalizeYear = (year) => year.trim().replace(/\s+/g, ' ').toLowerCase();
    const normalizeStatus = (status) => status.trim().toLowerCase();
    const statusMap = {};
    rows.forEach(r => {
      statusMap[normalizeYear(r.year)] = normalizeStatus(r.status);
    });
    yearSlots.forEach(y => {
      const key = normalizeYear(y);
      if (!statusMap[key]) statusMap[key] = 'incomplete';
    });
    res.json({ success: true, statuses: statusMap, academicYear });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch year statuses', error: error.message });
  }
};

// Verify Department OTP
exports.verifyDepartmentOtp = async (req, res) => {
  try {
    const { otp, email } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Email and OTP are required' });
    }

    // normalize inputs
    const emailTrim = String(email).trim().toLowerCase();
    const otpTrim = String(otp).trim();

    // ensure user exists
    const [userRows] = await pool.query('SELECT * FROM department_users WHERE email = ?', [emailTrim]);
    const user = userRows[0];
    if (!user) {
      return res.status(404).json({ success: false, message: 'No account found' });
    }

    // Check for valid unused OTP but DO NOT mark it used here
    const [resets] = await pool.query(
      'SELECT * FROM password_resets WHERE email = ? AND otp = ? AND expires_at > NOW() AND used = 0',
      [emailTrim, otpTrim]
    );

    if (resets.length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    // OTP is valid — allow frontend to proceed to reset step
    res.json({ success: true, message: 'OTP verified successfully' });
  } catch (error) {
    console.error('verifyDepartmentOtp error:', error);
    res.status(500).json({ success: false, message: 'Failed to verify OTP' });
  }
};

// Reset Department Password
exports.resetDepartmentPassword = async (req, res) => {
  try {
    console.log('Reset password request body:', req.body);
    let { email, otp, newPassword } = req.body;

    // sanitize inputs
    email = email ? String(email).trim().toLowerCase() : '';
    otp = otp ? String(otp).trim() : '';
    newPassword = newPassword ? String(newPassword) : '';

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ success: false, message: 'Email, OTP, and new password are required' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters' });
    }

    const [userRows] = await pool.query('SELECT * FROM department_users WHERE email = ?', [email]);
    const user = userRows[0];
    if (!user) {
      return res.status(404).json({ success: false, message: 'No account found' });
    }

    // Debug
    const [allOtps] = await pool.query('SELECT id, email, otp, expires_at, used, created_at FROM password_resets WHERE email = ?', [email]);
    console.log('All OTPs for email:', allOtps);

    const [resets] = await pool.query(
      'SELECT * FROM password_resets WHERE email = ? AND otp = ? AND expires_at > NOW() AND used = 0',
      [email, otp]
    );
    console.log('Matching OTP rows:', resets);

    if (resets.length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    // Hash and save password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE department_users SET password = ? WHERE email = ?', [hashedPassword, email]);

    // Mark OTP used
    const resetId = resets[0].id;
    await pool.query('UPDATE password_resets SET used = 1 WHERE id = ?', [resetId]);

    // Send confirmation including username + new password (per request)
    const transporter = createTransporter();
    // Nicer confirmation and include username + new password
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
            <p style="color:#334155;">Hello ${user.name || user.username || ''},</p>
            <p style="color:#334155;">Your password has been changed successfully.</p>
            <div style="background:#f1f5f9;padding:12px;border-radius:6px;margin:12px 0;">
              <p style="margin:0;font-size:13px"><strong>Username:</strong> ${user.username || ''}</p>
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
    console.error('resetDepartmentPassword error:', error);
    res.status(500).json({ success: false, message: 'Failed to reset password' });
  }
};