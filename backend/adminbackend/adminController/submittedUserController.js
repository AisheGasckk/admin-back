const { pool } = require('../../config/db');

// Get all submitted data
exports.getAllSubmittedData = async (req, res) => {
  try {
    const { department, type, degree_level, academic_year } = req.query;
    // include explicit status column so clients can rely on DB truth
    let query = `SELECT id, dept_id, department, name, year, type, hod, degree_level, academic_year, submitted_at, locked, status FROM submitted_data WHERE 1=1`;
    const params = [];
    if (department) {
      query += ' AND department = ?';
      params.push(department);
    }
    if (type) {
      query += ' AND type = ?';
      params.push(type);
    }
    if (degree_level) {
      query += ' AND degree_level = ?';
      params.push(degree_level);
    }
    if (academic_year) {
      query += ' AND academic_year = ?';
      params.push(academic_year);
    }
    query += ' ORDER BY submitted_at DESC';
    const [rows] = await pool.query(query, params);
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch submitted data', error: error.message });
  }
};

// Lock/unlock submitted data
exports.toggleLockSubmittedData = async (req, res) => {
  try {
    const { id } = req.params;
    let { locked } = req.body;
    locked = locked ? 1 : 0;
    const [result] = await pool.query(
      'UPDATE submitted_data SET locked = ? WHERE id = ?',
      [locked, id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Submission not found' });
    }
    res.json({ success: true, message: `Submission ${locked ? 'locked' : 'unlocked'} successfully` });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update lock status', error: error.message });
  }
};

// Delete submitted data
exports.deleteSubmittedData = async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await pool.query(
      'DELETE FROM submitted_data WHERE id = ?',
      [id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Submission not found' });
    }
    res.json({ success: true, message: 'Submission deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete submission', error: error.message });
  }
};

// Get distinct academic years
exports.getDistinctSubmittedAcademicYears = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT DISTINCT academic_year FROM submitted_data ORDER BY academic_year DESC');
    res.json({ success: true, years: rows.map(r => r.academic_year) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch academic years' });
  }
};