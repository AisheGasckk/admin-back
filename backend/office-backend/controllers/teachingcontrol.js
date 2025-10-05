const { pool } = require('../../../Admin/backend/config/db');

// Helper to sanitize date fields
function sanitizeDateFields(data) {
  const dateFields = [
    'date_of_birth',
    'date_of_joining',
    'date_of_joining_profession',
    'date_of_leaving',
    'date_of_status_change'
  ];
  dateFields.forEach(field => {
    if (data[field] === "") {
      data[field] = null;
    }
  });
  return data;
}

// Add new teaching staff record
exports.addTeachingStaff = async (req, res) => {
  try {
    let data = req.body;
    data = sanitizeDateFields(data);
    await pool.query('INSERT INTO teaching_staff SET ?', [data]);
    res.json({ success: true, message: 'Teaching staff entry submitted successfully!' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to submit entry', error: error.message });
  }
};

// Get all teaching staff records
exports.getAllTeachingStaff = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM teaching_staff ORDER BY id DESC');
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch teaching staff', error: error.message });
  }
};

// Update teaching staff record
exports.updateTeachingStaff = async (req, res) => {
  try {
    const { id } = req.params;
    let data = sanitizeDateFields(req.body);
    await pool.query('UPDATE teaching_staff SET ? WHERE id = ?', [data, id]);
    res.json({ success: true, message: 'Teaching staff entry updated successfully!' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update entry', error: error.message });
  }
};

// Get latest academic year from office_users table
exports.getAcademicYear = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT academic_year FROM office_users ORDER BY academic_year DESC LIMIT 1');
    res.json({ success: true, academic_year: rows[0]?.academic_year || "" });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch academic year', error: error.message });
  }
};