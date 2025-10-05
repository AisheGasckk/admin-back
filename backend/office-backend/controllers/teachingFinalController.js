const { pool } = require('../../../Admin/backend/config/db');

// Get lock status for teaching staff
exports.getTeachingLockStatus = async (req, res) => {
  const { academic_year } = req.query;
  try {
    const [rows] = await pool.query(
      'SELECT is_locked FROM office_submission WHERE academic_year = ? AND type = ? ORDER BY id DESC LIMIT 1',
      [academic_year, 'Teaching Staff']
    );
    res.json({ isLocked: rows.length > 0 ? !!rows[0].is_locked : false });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Final submission (lock) for teaching staff
exports.finalTeachingSubmit = async (req, res) => {
  const { academic_year, type, status, office_id, name } = req.body;
  try {
    await pool.query(
      'DELETE FROM office_submission WHERE academic_year = ? AND type = ? AND office_id = ? AND name = ?',
      [academic_year, type, office_id, name]
    );
    await pool.query(
      'INSERT INTO office_submission (academic_year, type, status, office_id, name, is_locked, submitted_at) VALUES (?, ?, ?, ?, ?, 1, NOW())',
      [academic_year, type, status, office_id, name]
    );
    res.json({ success: true, message: "Final submission completed and locked." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};