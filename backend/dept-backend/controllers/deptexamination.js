const { pool } = require('../../config/db');

// Add examination data
exports.addExaminationData = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const { records } = req.body;

    if (!Array.isArray(records)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid data format'
      });
    }

    for (const record of records) {
      const {
        academic_year,
        dept_id,
        category_id,
        subcategory_id,
        gender_id,
        count,
        year,
        result_type,
        degree_level
      } = record;

      if (
        count > 0 &&
        academic_year &&
        dept_id &&
        category_id &&
        subcategory_id &&
        gender_id &&
        year &&
        result_type &&
        degree_level
      ) {
        await connection.query(
          `INSERT INTO student_examination 
           (academic_year, dept_id, category_id, subcategory_id, gender_id, count, year, result_type, degree_level)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [academic_year, dept_id, category_id, subcategory_id, gender_id, count, year, result_type, degree_level]
        );
      }
    }

    await connection.commit();
    res.json({
      success: true,
      message: 'Examination data added successfully'
    });
    // After successful commit, update year status to 'Completed'
    if (records && records.length > 0) {
      const { dept_id, year, academic_year, degree_level } = records[0];
      await pool.query(
        'UPDATE student_examination SET status = ? WHERE dept_id = ? AND year = ? AND academic_year = ? AND degree_level = ?',
        ['Completed', dept_id, year, academic_year, degree_level]
      );
    }
  } catch (error) {
    await connection.rollback();
    res.status(500).json({
      success: false,
      message: 'Failed to add examination data',
      error: error.message
    });
  } finally {
    connection.release();
  }
};

// Get examination details
exports.getExaminationDetails = async (req, res) => {
  try {
    const { deptId } = req.params;
    if (!deptId) {
      return res.status(400).json({
        success: false,
        message: 'Department ID is required'
      });
    }

    const [rows] = await pool.query(
      `SELECT 
        se.academic_year,
        se.year,
        se.degree_level,
        se.result_type,
        c.name as category,
        sc.name as subcategory,
        SUM(CASE WHEN g.name = 'Male' THEN se.count ELSE 0 END) as male_count,
        SUM(CASE WHEN g.name = 'Female' THEN se.count ELSE 0 END) as female_count,
        SUM(CASE WHEN g.name = 'Transgender' THEN se.count ELSE 0 END) as transgender_count
      FROM student_examination se
      JOIN category_master c ON se.category_id = c.id
      JOIN category_master sc ON se.subcategory_id = sc.id
      JOIN gender_master g ON se.gender_id = g.id
      WHERE se.dept_id = ?
      GROUP BY se.academic_year, se.year, se.degree_level, se.result_type, c.name, sc.name
      ORDER BY se.academic_year DESC, se.year ASC, se.result_type ASC, se.degree_level ASC`,
      [deptId]
    );

    res.json({
      success: true,
      details: rows || []
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch examination details'
    });
  }
};

// Update status for examination records
exports.updateExaminationStatus = async (req, res) => {
  try {
    const { dept_id, year, status, academic_year, degree_level } = req.body;
    if (!dept_id || !year || !status || !academic_year || !degree_level) {
      return res.status(400).json({
        success: false,
        message: 'dept_id, year, status, academic_year, and degree_level are required'
      });
    }
    await pool.query(
      'UPDATE student_examination SET status = ? WHERE dept_id = ? AND year = ? AND academic_year = ? AND degree_level = ?',
      [status, dept_id, year, academic_year, degree_level]
    );
    res.json({ success: true, message: `Status updated to ${status}` });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update status',
      error: error.message
    });
  }
};

// Update examination data
exports.updateExaminationData = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const { records } = req.body;

    if (!Array.isArray(records)) {
      return res.status(400).json({ success: false, message: 'Invalid data format' });
    }

    for (const record of records) {
      const {
        academic_year,
        dept_id,
        category_id,
        subcategory_id,
        gender_id,
        count,
        year,
        result_type,
        degree_level
      } = record;

      // Only update if record exists
      const [existing] = await connection.query(
        `SELECT id FROM student_examination 
         WHERE academic_year = ? AND dept_id = ? AND category_id = ? AND subcategory_id = ? AND gender_id = ? AND year = ? AND result_type = ? AND degree_level = ?`,
        [academic_year, dept_id, category_id, subcategory_id, gender_id, year, result_type, degree_level]
      );

      if (existing.length > 0) {
        // Update existing record
        await connection.query(
          `UPDATE student_examination SET count = ? 
           WHERE id = ?`,
          [count, existing[0].id]
        );
      }
      // Do NOT insert new record if not exists during update
    }

    await connection.commit();
    res.json({ success: true, message: 'Examination data updated successfully' });
    // After successful update, update year status to 'Completed'
    if (records && records.length > 0) {
      const { dept_id, year, academic_year, degree_level } = records[0];
      await pool.query(
        'UPDATE student_examination SET status = ? WHERE dept_id = ? AND year = ? AND academic_year = ? AND degree_level = ?',
        ['Completed', dept_id, year, academic_year, degree_level]
      );
    }
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ success: false, message: 'Failed to update examination data', error: error.message });
  } finally {
    connection.release();
  }
};

// Submit examination declaration
exports.submitExaminationDeclaration = async (req, res) => {
  try {
    const { dept_id, name, department, year, type, hod, degree_level, academic_year } = req.body;
    if (!dept_id || !name || !department || !year || !type || !hod || !degree_level || !academic_year) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }
    // Delete previous submission for this dept/year/type/degree_level/academic_year
    await pool.query(
      `DELETE FROM submitted_data WHERE dept_id = ? AND year = ? AND type = ? AND degree_level = ? AND academic_year = ?`,
      [dept_id, year, type, degree_level, academic_year]
    );
    // Insert new submission
    await pool.query(
      `INSERT INTO submitted_data 
       (dept_id, name, department, year, type, hod, degree_level, academic_year, submitted_at, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?)`,
      [dept_id, name, department, year, type, hod, degree_level, academic_year, 'Completed']
    );
    res.json({ success: true, message: 'Examination declaration submitted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to submit declaration', error: error.message });
  }
};

// POST /student-examination/lock-declaration
exports.lockDeclaration = async (req, res) => {
  try {
    const { dept_id, year, type, degree_level, academic_year } = req.body;
    if (!dept_id || !year || !type || !degree_level || !academic_year) {
      return res.status(400).json({ success: false, message: 'dept_id, year, type, degree_level, and academic_year are required' });
    }
    await pool.query(
      `UPDATE submitted_data SET locked = 1 WHERE dept_id = ? AND year = ? AND type = ? AND degree_level = ? AND academic_year = ?`,
      [dept_id, year, type, degree_level, academic_year]
    );
    res.json({ success: true, message: 'Declaration locked successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to lock declaration', error: error.message });
  }
};

// Check if declaration is locked and submitted
exports.getDeclarationLockStatus = async (req, res) => {
  try {
    const { deptId, year, type, degree_level, academic_year } = req.query;
    if (!deptId || !year || !type || !degree_level || !academic_year) {
      return res.status(400).json({ success: false, message: 'deptId, year, type, degree_level, and academic_year are required' });
    }
    const [rows] = await pool.query(
      `SELECT locked FROM submitted_data WHERE dept_id = ? AND year = ? AND type = ? AND degree_level = ? AND academic_year = ? ORDER BY submitted_at DESC LIMIT 1`,
      [deptId, year, type, degree_level, academic_year]
    );
    if (rows.length > 0 && rows[0].locked === 1) {
      return res.json({ success: true, locked: true });
    }
    res.json({ success: true, locked: false });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to check lock status', error: error.message });
  }
};

// Get examination year statuses
exports.getExaminationYearStatuses = async (req, res) => {
  try {
    const { deptId } = req.params;
    const { degree_level, academic_year } = req.query;
    const yearSlots = degree_level === 'UG' ? ['I Year', 'II Year', 'III Year'] : ['I Year', 'II Year'];
    if (!deptId || !degree_level || !academic_year) {
      return res.status(400).json({ success: false, message: 'Missing parameters' });
    }
    const [rows] = await pool.query(
      `SELECT year, status FROM student_examination WHERE dept_id = ? AND degree_level = ? AND academic_year = ?`,
      [deptId, degree_level, academic_year]
    );
    const statusMap = {};
    rows.forEach(r => {
      statusMap[r.year] = r.status;
    });
    const result = yearSlots.map(year => ({
      year,
      status: statusMap[year] === 'Completed' ? 'Completed' : 'Incompleted'
    }));
    res.json({ success: true, statuses: result });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch year statuses' });
  }
};

