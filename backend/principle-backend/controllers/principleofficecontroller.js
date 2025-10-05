const { pool } = require('../../../Admin/backend/config/db');

// Get all office submissions (Teaching & Non-Teaching)
exports.getAllOfficeSubmissions = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, academic_year, type, status, is_locked, submitted_at
       FROM office_submission
       ORDER BY academic_year DESC, type ASC, submitted_at DESC`
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};