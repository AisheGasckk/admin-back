const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');
const { pool } = require('../../../Admin/backend/config/db');

const createTransporter = () => nodemailer.createTransport({
  service: 'gmail',
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
  tls: { rejectUnauthorized: false }
});

// === 1. Forgot Password: Creates and sends an OTP ===
exports.forgotPrinciplePassword = async (req, res) => {
  try {
    const emailRaw = req.body.email;
    if (!emailRaw) return res.status(400).json({ success: false, message: 'Email is required' });
    const email = String(emailRaw).trim().toLowerCase();

    // The principle is stored in the 'admin' table with role = 'principle'
    const [rows] = await pool.query("SELECT * FROM admin WHERE email = ? AND role = 'principle'", [email]);
    const user = rows[0];
    if (!user) return res.status(404).json({ success: false, message: 'No principle account found for this email' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiryTime = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await pool.query('INSERT INTO password_resets (email, otp, expires_at, used) VALUES (?, ?, ?, 0)', [email, otp, expiryTime]);

    const maskedEmail = email.replace(/(.{2})(.*)(@.*)/, '$1***$3');

    const transporter = createTransporter();
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

    res.json({ success: true, message: 'Reset code sent successfully', maskedEmail });
  } catch (error) {
    console.error('forgotPrinciplePassword error:', error);
    res.status(500).json({ success: false, message: 'Failed to send reset code' });
  }
};

// === 2. Verify OTP: Checks if OTP is valid but does NOT mark it as used ===
exports.verifyPrincipalOtp = async (req, res) => {
  try {
    const emailRaw = req.body.email;
    const otpRaw = req.body.otp;
    if (!emailRaw || !otpRaw) return res.status(400).json({ success: false, message: 'Email and OTP are required' });
    const email = String(emailRaw).trim().toLowerCase();
    const otp = String(otpRaw).trim();

    const [resets] = await pool.query(
      'SELECT * FROM password_resets WHERE email = ? AND otp = ? AND expires_at > NOW() AND used = 0',
      [email, otp]
    );
    if (resets.length === 0) return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });

    res.json({ success: true, message: 'OTP verified successfully' });
  } catch (error) {
    console.error('verifyPrincipalOtp error:', error);
    res.status(500).json({ success: false, message: 'Failed to verify OTP' });
  }
};

// === 3. Reset Password: Re-verifies OTP, resets password, THEN marks OTP as used ===
exports.resetPrincipalPassword = async (req, res) => {
  try {
    let { email, otp, newPassword } = req.body;
    email = email ? String(email).trim().toLowerCase() : '';
    otp = otp ? String(otp).trim() : '';
    newPassword = newPassword ? String(newPassword) : '';

    if (!email || !otp || !newPassword) return res.status(400).json({ success: false, message: 'Email, OTP, and new password are required' });
    if (newPassword.length < 8) return res.status(400).json({ success: false, message: 'Password must be at least 8 characters' });

    // Re-verify the OTP to ensure it's still valid and unused
    const [resets] = await pool.query('SELECT * FROM password_resets WHERE email = ? AND otp = ? AND expires_at > NOW() AND used = 0', [email, otp]);
    if (resets.length === 0) return res.status(400).json({ success: false, message: 'Invalid or expired OTP. Please try again.' });

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update the password in the 'admin' table for the principle
    const [updateResult] = await pool.query("UPDATE admin SET password = ? WHERE email = ? AND role = 'principle'", [hashedPassword, email]);
    if (updateResult.affectedRows === 0) {
        return res.status(404).json({ success: false, message: 'Could not update password. Account not found.' });
    }

    // NOW, mark the OTP as used
    const resetId = resets[0].id;
    await pool.query('UPDATE password_resets SET used = 1 WHERE id = ?', [resetId]);

    // Send confirmation email
    const [userRows] = await pool.query("SELECT username, name FROM admin WHERE email = ? AND role = 'principle'", [email]);
    const user = userRows[0];

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
            <div style="background:#f1f5f9;padding:14px;border-radius:8px;margin-top:12px;">
              <p style="margin:0 0 6px;"><strong>Username:</strong> ${user.username}</p>
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
    console.error('resetPrincipalPassword error:', error);
    res.status(500).json({ success: false, message: 'Failed to reset password' });
  }
};

// Login controller
exports.principleLogin = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Input validation
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required',
      });
    }

    // Fetch principle from admin table
    const [rows] = await pool.query(
      'SELECT * FROM admin WHERE username = ? AND role = ?',
      [username, 'principle']
    );

    if (rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password',
      });
    }

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ success: false, message: 'Invalid username or password' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, username: user.username },
      process.env.JWT_SECRET || 'your-secret-key',
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
        name: user.name,
      },
    });
  } catch (error) {
    console.error('Principle login error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred during login',
    });
  }
};

// Get principle profile
exports.getProfile = async (req, res) => {
  try {
    const [user] = await pool.query(
      'SELECT id, username, email, name, role FROM admin WHERE id = ?',
      [req.user.id]
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found'
      });
    }

    res.json({
      success: true,
      user
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get dashboard statistics
exports.getStatistics = async (req, res) => {
  try {
    // Get department count from department_users table
    const [departments] = await pool.query('SELECT COUNT(DISTINCT dept_id) as count FROM department_users');
    // Get faculty count from department_users table (if you have a role/column for faculty, otherwise set to 0)
    const [faculty] = await pool.query('SELECT COUNT(*) as count FROM department_users WHERE role = "faculty"');
    // Get student count from student_enrollment table
    const [students] = await pool.query('SELECT SUM(count) as count FROM student_enrollment');

    res.json({
      success: true,
      statistics: {
        departmentCount: departments[0].count,
        facultyCount: faculty[0]?.count || 0,
        studentCount: students[0]?.count || 0
      }
    });

  } catch (error) {
    console.error('Get statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Update principle profile
exports.updateProfile = async (req, res) => {
  try {
    const { name, email } = req.body;
    
    await pool.query(
      'UPDATE admin SET name = ?, email = ? WHERE id = ?',
      [name, email, req.user.id]
    );

    res.json({
      success: true,
      message: 'Profile updated successfully'
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};


// Get departments list
exports.getDepartmentsList = async (req, res) => {
  try {
    // Get all department names and ids from department_master (or similar), fallback to department_users if not available
    let departments;
    try {
      // Try to get from department_master (recommended for full list)
      [departments] = await pool.query('SELECT id as dept_id, name as department FROM department_master');
    } catch (e) {
      // Fallback to department_users
      [departments] = await pool.query('SELECT DISTINCT dept_id, department FROM department_users');
    }
    res.json({ success: true, departments });
  } catch (error) {
    console.error('Get departments list error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Get department details
exports.getDepartmentDetails = async (req, res) => {
  try {
    const { deptId } = req.params;

    // Get the latest academic_year for this department
    const [academicYearRows] = await pool.query(
      'SELECT academic_year FROM department_users WHERE dept_id = ? ORDER BY academic_year DESC LIMIT 1',
      [deptId]
    );
    const academic_year = academicYearRows.length > 0 ? academicYearRows[0].academic_year : null;

    // If no academic_year found, return empty details
    if (!academic_year) {
      return res.json({
        success: true,
        academic_year: null,
        enrollmentDetails: [],
        examinationDetails: []
      });
    }

    // Enrollment details for latest academic_year
    const [enrollmentDetails] = await pool.query(
      `SELECT 
        se.year,
        se.degree_level,
        cm.name as category,
        scm.name as subcategory,
        SUM(CASE WHEN gm.name = 'Male' THEN se.count ELSE 0 END) as male_count,
        SUM(CASE WHEN gm.name = 'Female' THEN se.count ELSE 0 END) as female_count,
        SUM(CASE WHEN gm.name = 'Transgender' THEN se.count ELSE 0 END) as transgender_count
      FROM student_enrollment se
      JOIN category_master cm ON se.category_id = cm.id
      JOIN category_master scm ON se.subcategory_id = scm.id
      JOIN gender_master gm ON se.gender_id = gm.id
      WHERE se.dept_id = ? AND se.academic_year = ?
      GROUP BY se.year, se.degree_level, cm.name, scm.name`,
      [deptId, academic_year]
    );

    // Examination details for latest academic_year
    const [examinationDetails] = await pool.query(
      `SELECT 
        se.year,
        se.degree_level,
        cm.name as category,
        scm.name as subcategory,
        se.result_type,
        SUM(CASE WHEN gm.name = 'Male' THEN se.count ELSE 0 END) as male_count,
        SUM(CASE WHEN gm.name = 'Female' THEN se.count ELSE 0 END) as female_count,
        SUM(CASE WHEN gm.name = 'Transgender' THEN se.count ELSE 0 END) as transgender_count
      FROM student_examination se
      JOIN category_master cm ON se.category_id = cm.id
      JOIN category_master scm ON se.subcategory_id = scm.id
      JOIN gender_master gm ON se.gender_id = gm.id
      WHERE se.dept_id = ? AND se.academic_year = ?
      GROUP BY se.year, se.degree_level, cm.name, scm.name, se.result_type`,
      [deptId, academic_year]
    );

    res.json({
      success: true,
      academic_year,
      enrollmentDetails,
      examinationDetails
    });
  } catch (error) {
    console.error('Get department details error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

