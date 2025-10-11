const { pool } = require('../../config/db');
const bcrypt = require('bcrypt');

// Fetch all admins (include password)
exports.getAllAdmins = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, username, email, name, mobile, role, password, academic_year FROM admin');
    res.json({ success: true, admins: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch admins', error: error.message });
  }
};

// Fetch admin by ID (include password)
exports.getAdminById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query('SELECT id, username, email, name, mobile, role, password, academic_year FROM admin WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Admin not found' });
    res.json({ success: true, admin: rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch admin', error: error.message });
  }
};

// Add a new admin (with password)
exports.addAdmin = async (req, res) => {
  try {
    const { username, email, name, mobile, role, password, academic_year } = req.body;
    if (!username || !email || !name || !mobile || !role || !password) {
      return res.status(400).json({ success: false, message: 'All fields including password are required' });
    }
    const [exists] = await pool.query('SELECT id FROM admin WHERE username = ? OR email = ?', [username, email]);
    if (exists.length > 0) {
      return res.status(409).json({ success: false, message: 'Username or Email already exists' });
    }
    const hashedPassword = await bcrypt.hash(password, 10); // Hash password
    const [result] = await pool.query(
      'INSERT INTO admin (username, email, name, mobile, role, password, academic_year) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [username, email, name, mobile, role, hashedPassword, academic_year]
    );

    if (result.affectedRows > 0) {
      res.json({ success: true, message: 'Admin added successfully' });
    } else {
      res.status(500).json({ success: false, message: 'Failed to add admin' });
    }
  } catch (error) {
    console.error('Error adding admin:', error);
    res.status(500).json({ success: false, message: 'An error occurred while adding the admin', error: error.message });
  }
};

// Update admin (optionally update password)
exports.updateAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { username, email, name, mobile, role, password, academic_year } = req.body;
    if (!username || !email || !name || !mobile || !role) {
      return res.status(400).json({ success: false, message: 'All fields except password are required' });
    }
    let query = 'UPDATE admin SET username = ?, email = ?, name = ?, mobile = ?, role = ?';
    let params = [username, email, name, mobile, role];
    if (password && password.trim() !== '') {
      const hashedPassword = await bcrypt.hash(password, 10); // Hash password
      query += ', password = ?';
      params.push(hashedPassword);
    }
    query += ', academic_year = ? WHERE id = ?';
    params.push(academic_year, id);

    const [result] = await pool.query(query, params);
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Admin not found' });
    res.json({ success: true, message: 'Admin updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update admin', error: error.message });
  }
};

// Delete admin
exports.deleteAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await pool.query('DELETE FROM admin WHERE id = ?', [id]);
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Admin not found' });
    res.json({ success: true, message: 'Admin deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete admin', error: error.message });
  }
};

// Update academic year in department_users and office_users
exports.updateAcademicYearForAll = async (req, res) => {
  try {
    const { newAcademicYear } = req.body;
    if (!newAcademicYear) {
      return res.status(400).json({ success: false, message: 'New academic year is required' });
    }
    await pool.query('UPDATE department_users SET academic_year = ?', [newAcademicYear]);
    await pool.query('UPDATE office_users SET academic_year = ?', [newAcademicYear]);
    // Also update admin table so frontend shows the new year immediately
    await pool.query('UPDATE admin SET academic_year = ?', [newAcademicYear]);

    res.json({ success: true, message: 'Academic year updated for all users' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update academic year', error: error.message });
  }
};

// Admin login
exports.loginAdmin = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username and password are required' });
    }
    const [rows] = await pool.query('SELECT * FROM admin WHERE username = ?', [username]);
    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid username or password' });
    }
    const user = rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ success: false, message: 'Invalid username or password' });
    }
    // Generate token and respond (token generation code should be here)
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to login', error: error.message });
  }
};

async function ensureAppSettingsTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS app_settings (
      name VARCHAR(64) PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);
}

exports.getMaintenanceStatus = async (req, res) => {
  try {
    await ensureAppSettingsTable();
    const [rows] = await pool.query(
      "SELECT name, value FROM app_settings WHERE name IN ('maintenance_mode','maintenance_message')"
    );
    const map = Object.fromEntries(rows.map(r => [r.name, r.value]));
    const enabled = map.maintenance_mode === '1' || map.maintenance_mode === 'true';
    const message = map.maintenance_message || '';
    res.json({ success: true, maintenance: { enabled, message } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to get maintenance status', error: error.message });
  }
};

exports.setMaintenanceStatus = async (req, res) => {
  try {
    await ensureAppSettingsTable();
    const enabled = req.body?.enabled ?? req.body?.maintenance ?? false;
    const message = (req.body?.message || '').toString();

    await pool.query(
      "INSERT INTO app_settings (name,value) VALUES ('maintenance_mode', ?) ON DUPLICATE KEY UPDATE value=VALUES(value)",
      [enabled ? '1' : '0']
    );
    await pool.query(
      "INSERT INTO app_settings (name,value) VALUES ('maintenance_message', ?) ON DUPLICATE KEY UPDATE value=VALUES(value)",
      [message]
    );

    res.json({ success: true, maintenance: { enabled: !!enabled, message } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to set maintenance status', error: error.message });
  }
};


