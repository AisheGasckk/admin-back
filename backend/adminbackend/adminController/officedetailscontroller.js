const { pool } = require('../../config/db');

// Teaching Staff Details
exports.getTeachingDetails = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM teaching_staff ORDER BY id DESC');
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch teaching staff', error: error.message });
  }
};

// Non-Teaching Staff Details (aggregate for summary)
exports.getNonTeachingDetails = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        nts.staff_group,
        nts.staff_type,
        nts.academic_year,
        SUM(CASE WHEN gm.name = 'Male' THEN nts.filled_count ELSE 0 END) AS male_count,
        SUM(CASE WHEN gm.name = 'Female' THEN nts.filled_count ELSE 0 END) AS female_count,
        SUM(CASE WHEN gm.name = 'Transgender' THEN nts.filled_count ELSE 0 END) AS transgender_count,
        MAX(nts.sanctioned_strength) AS sanctioned_strength
      FROM non_teaching_staff nts
      JOIN gender_master gm ON nts.gender_id = gm.id
      GROUP BY nts.staff_group, nts.staff_type, nts.academic_year
      ORDER BY nts.staff_group, nts.staff_type, nts.academic_year DESC
    `);
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch non-teaching staff', error: error.message });
  }
};

// Office Submission Details
exports.getOfficeSubmissionDetails = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM office_submission ORDER BY academic_year DESC, type ASC, submitted_at DESC');
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch office submissions', error: error.message });
  }
};