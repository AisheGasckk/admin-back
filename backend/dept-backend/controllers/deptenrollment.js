async function recalculateEnrollmentYearStatuses(dept_id, academic_year, degree_level) {
  const yearSlots = ['I Year', 'II Year', 'III Year'];
  for (const year of yearSlots) {
    const [rows] = await pool.query(
      `SELECT COUNT(*) as cnt FROM student_enrollment WHERE dept_id = ? AND academic_year = ? AND degree_level = ? AND year = ?`,
      [dept_id, academic_year, degree_level, year]
    );
    const status = (rows[0].cnt > 0) ? 'Completed' : 'Incompleted';
    await pool.query(
      `UPDATE student_enrollment SET status = ? WHERE dept_id = ? AND academic_year = ? AND degree_level = ? AND year = ?`,
      [status, dept_id, academic_year, degree_level, year]
    );
  }
}

const { pool } = require('../../config/db');
const nodemailer = require('nodemailer');

// Create email transporter function (if needed for enrollment)
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

// Add enrollment data
exports.addEnrollmentData = async (req, res) => {
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
        degree_level
      ) {
        await connection.query(
          `INSERT INTO student_enrollment 
           (academic_year, dept_id, category_id, subcategory_id, gender_id, count, year, degree_level, status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [academic_year, dept_id, category_id, subcategory_id, gender_id, count, year, degree_level, 'Completed']
        );
      } else {
        console.warn('Skipping invalid record:', record);
      }
    }

    await connection.commit();
    res.json({
      success: true,
      message: 'Enrollment data added successfully'
    });
    // After successful commit, update year status to 'Completed'
    if (records && records.length > 0) {
      const { dept_id, year, academic_year, degree_level } = records[0];
      await pool.query(
        'UPDATE student_enrollment SET status = ? WHERE dept_id = ? AND year = ? AND academic_year = ? AND degree_level = ?',
        ['Completed', dept_id, year, academic_year, degree_level]
      );
    }
  } catch (error) {
    await connection.rollback();
    res.status(500).json({
      success: false,
      message: 'Failed to add enrollment data',
      error: error.message
    });
  } finally {
    connection.release();
  }
};

// Update student enrollment data
exports.updateEnrollmentData = async (req, res) => {
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
        degree_level
      } = record;

      // Find existing record by exact match including gender_id
      const [existing] = await connection.query(
        `SELECT id FROM student_enrollment 
         WHERE academic_year = ? 
         AND dept_id = ? 
         AND category_id = ? 
         AND subcategory_id = ? 
         AND gender_id = ? 
         AND year = ? 
         AND degree_level = ?
         LIMIT 1`,
        [academic_year, dept_id, category_id, subcategory_id, 
         gender_id, year, degree_level]
      );

      if (existing.length > 0) {
        // Update existing record with new count
        await connection.query(
          `UPDATE student_enrollment 
           SET count = ?
           WHERE id = ?`,
          [Number(count || 0), existing[0].id]
        );
      } else {
        // Only insert if record doesn't exist
        await connection.query(
          `INSERT INTO student_enrollment 
           (academic_year, dept_id, category_id, subcategory_id, 
            gender_id, count, year, degree_level, status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [academic_year, dept_id, category_id, subcategory_id,
           gender_id, Number(count || 0), year, degree_level, 'Completed']
        );
      }
    }

    await connection.commit();
    res.json({ 
      success: true, 
      message: 'Enrollment data updated successfully' 
    });

  } catch (error) {
    await connection.rollback();
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update enrollment data', 
      error: error.message 
    });
  } finally {
    connection.release();
  }
};

// Modify getStudentDetails query to properly aggregate by gender
exports.getStudentDetails = async (req, res) => {
  try {
    const { deptId } = req.params;
    
    const [rows] = await pool.query(
      `SELECT 
        sd.academic_year,
        sd.year,
        sd.degree_level,
        c.name as category,
        sc.name as subcategory,
        sd.status,
        SUM(CASE WHEN g.name = 'Male' THEN sd.count ELSE 0 END) as male_count,
        SUM(CASE WHEN g.name = 'Female' THEN sd.count ELSE 0 END) as female_count,
        SUM(CASE WHEN g.name = 'Transgender' THEN sd.count ELSE 0 END) as transgender_count
      FROM student_enrollment sd
      JOIN category_master c ON sd.category_id = c.id
      JOIN category_master sc ON sd.subcategory_id = sc.id
      JOIN gender_master g ON sd.gender_id = g.id
      WHERE sd.dept_id = ?
      GROUP BY 
        sd.academic_year, 
        sd.year, 
        sd.degree_level,
        c.name,
        sc.name,
        sd.status
      ORDER BY sd.academic_year DESC, sd.year ASC, sd.degree_level ASC`,
      [deptId]
    );

    res.json({
      success: true,
      details: rows || []
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch student details'
    });
  }
};
// Update status for all enrollment records for a dept and year
exports.updateEnrollmentStatus = async (req, res) => {
  try {
    const { dept_id, year, status } = req.body;
    if (!dept_id || !year || !status) {
      return res.status(400).json({ success: false, message: 'dept_id, year, and status are required' });
    }
    // Only allow 'Completed' or 'Incompleted' as status
    const allowed = ['Completed', 'Incompleted'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value' });
    }
    await pool.query(
      'UPDATE student_enrollment SET status = ? WHERE dept_id = ? AND year = ?',
      [status, dept_id, year]
    );
    res.json({ success: true, message: `Status updated to ${status}` });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update status', error: error.message });
  }
};

// Delete enrollment records by year and subcategories
exports.deleteEnrollmentByYear = async (req, res) => {
  const { dept_id, year, subcategories } = req.body;
  if (!dept_id || !year || !subcategories) {
    return res.status(400).json({ success: false, message: 'Missing parameters' });
  }
  await pool.query(
    `DELETE FROM student_enrollment WHERE dept_id = ? AND year = ? AND subcategory_id IN (?)`,
    [dept_id, year, subcategories]
  );
  res.json({ success: true });
};

// Submit enrollment declaration
exports.submitEnrollmentDeclaration = async (req, res) => {
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
    res.json({ success: true, message: 'Enrollment declaration submitted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to submit enrollment declaration', error: error.message });
  }
};

// POST /student-enrollment/lock-declaration
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
    let query, params;
    query = `SELECT locked FROM submitted_data WHERE dept_id = ? AND year = ? AND type = ? AND degree_level = ? AND academic_year = ? ORDER BY submitted_at DESC LIMIT 1`;
    params = [deptId, year, type, degree_level, academic_year];
    const [rows] = await pool.query(query, params);
    if (rows.length > 0 && rows[0].locked === 1) {
      return res.json({ success: true, locked: true });
    }
    res.json({ success: true, locked: false });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to check lock status', error: error.message });
  }
};


// Get allowed degree levels for a department
exports.getAllowedDegreeLevels = async (req, res) => {
  try {
    const { deptId } = req.params;
    if (!deptId) {
      return res.status(400).json({ success: false, message: 'Department ID is required' });
    }
    // Query all unique degree levels for this department
    const [rows] = await pool.query(
      `SELECT DISTINCT degree_level FROM department_users WHERE dept_id = ?`,
      [deptId]
    );
    const degreeLevels = rows.map(r => r.degree_level).filter(Boolean);
    res.json({ success: true, degree_levels: degreeLevels });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch degree levels', error: error.message });
  }
};