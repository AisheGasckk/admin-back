const { pool } = require('../../../Admin/backend/config/db');

// Student Enrollment Summary
exports.getDepartmentEnrollmentSummary = async (req, res) => {
  try {
    const { academic_year } = req.query;
    const params = [];
    const where = academic_year ? `WHERE se.academic_year = ?` : '';
    if (academic_year) params.push(academic_year);

    const [rows] = await pool.query(`
      SELECT 
        du.department AS department_name,
        se.degree_level,
        se.year,
        SUM(CASE WHEN g.name = 'Male' THEN se.count ELSE 0 END) AS male_count,
        SUM(CASE WHEN g.name = 'Female' THEN se.count ELSE 0 END) AS female_count,
        SUM(CASE WHEN g.name = 'Transgender' THEN se.count ELSE 0 END) AS transgender_count
      FROM student_enrollment se
      JOIN department_users du ON se.dept_id = du.dept_id
      JOIN gender_master g ON se.gender_id = g.id
      ${where}
      GROUP BY du.department, se.degree_level, se.year
      ORDER BY du.department, se.degree_level, se.year
    `, params);

    res.json({ success: true, summary: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch enrollment summary', error: error.message });
  }
};

// Student Examination Summary
exports.getDepartmentExaminationSummary = async (req, res) => {
  try {
    const { academic_year } = req.query;
    const params = [];
    const where = academic_year ? `WHERE se.academic_year = ?` : '';
    if (academic_year) params.push(academic_year);

    const [rows] = await pool.query(`
      SELECT 
        du.department AS department_name,
        se.degree_level,
        se.year,
        se.result_type,
        SUM(CASE WHEN g.name = 'Male' THEN se.count ELSE 0 END) AS male_count,
        SUM(CASE WHEN g.name = 'Female' THEN se.count ELSE 0 END) AS female_count,
        SUM(CASE WHEN g.name = 'Transgender' THEN se.count ELSE 0 END) AS transgender_count
      FROM student_examination se
      JOIN department_users du ON se.dept_id = du.dept_id
      JOIN gender_master g ON se.gender_id = g.id
      ${where}
      GROUP BY du.department, se.degree_level, se.year, se.result_type
      ORDER BY du.department, se.degree_level, se.year, se.result_type
    `, params);

    res.json({ success: true, summary: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch examination summary', error: error.message });
  }
};

// Teaching Staff Summary
exports.getTeachingStaffSummary = async (req, res) => {
  try {
    const { academic_year } = req.query;
    const params = [];
    const where = academic_year ? `WHERE academic_year = ?` : '';
    if (academic_year) params.push(academic_year);

    const [rows] = await pool.query(`
      SELECT *
      FROM teaching_staff
      ${where}
      ORDER BY id DESC
    `, params);
    res.json({ success: true, summary: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch teaching staff', error: error.message });
  }
};

// Non-Teaching Staff Summary
exports.getNonTeachingStaffSummary = async (req, res) => {
  try {
    const { academic_year } = req.query;
    const params = [];
    const where = academic_year ? `WHERE nts.academic_year = ?` : '';
    if (academic_year) params.push(academic_year);

    const [rows] = await pool.query(`
      SELECT 
        nts.staff_type, 
        nts.staff_group,
        SUM(CASE WHEN gm.name = 'Male' THEN nts.filled_count ELSE 0 END) AS male_count,
        SUM(CASE WHEN gm.name = 'Female' THEN nts.filled_count ELSE 0 END) AS female_count,
        SUM(CASE WHEN gm.name = 'Transgender' THEN nts.filled_count ELSE 0 END) AS transgender_count,
        MAX(nts.sanctioned_strength) AS sanctioned_strength
      FROM non_teaching_staff nts
      JOIN gender_master gm ON nts.gender_id = gm.id
      ${where}
      GROUP BY nts.staff_type, nts.staff_group
      ORDER BY nts.staff_group, nts.staff_type
    `, params);
    res.json({ success: true, summary: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch non-teaching staff', error: error.message });
  }
};