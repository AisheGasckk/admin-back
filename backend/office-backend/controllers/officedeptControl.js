const { pool } = require('../../../Admin/backend/config/db');

/**
 * Controller for officedept_data table
 * Endpoints expected by frontend:
 *  GET  /api/office/officedept/office-user-year
 *  POST /api/office/officedept/create
 *  GET  /api/office/officedept/get
 *  PUT  /api/office/officedept/update
 */

exports.getOfficeUserAcademicYear = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT academic_year FROM office_users LIMIT 1');
    const academic_year = rows.length > 0 ? rows[0].academic_year : null;
    res.json({ success: true, academic_year });
  } catch (err) {
    console.error('getOfficeUserAcademicYear error', err);
    res.status(500).json({ success: false, message: 'Failed to fetch office user academic year' });
  }
};

exports.createOfficeDeptData = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const { records } = req.body;
    if (!Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ success: false, message: 'Empty records' });
    }

    // delete existing entries for same key to avoid duplicates
    const sample = records[0];
    await connection.query(
      `DELETE FROM officedept_data WHERE academic_year = ? AND department = ? AND degree_level = ? AND year = ?`,
      [sample.academic_year, sample.department, sample.degree_level, sample.year]
    );

    for (const r of records) {
      // Insert without referencing created_at column (some DBs don't have that column)
      await connection.query(
        `INSERT INTO officedept_data
         (academic_year, department, degree_level, year, category_id, subcategory_id, gender_id, count, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          r.academic_year,
          r.department,
          r.degree_level,
          r.year,
          r.category_id || null,
          r.subcategory_id || null,
          r.gender_id || null,
          r.count || 0,
          r.status || 'Incompleted'
        ]
      );
    }

    await connection.commit();
    res.json({ success: true, message: 'Office department data saved' });
  } catch (err) {
    await connection.rollback();
    console.error('createOfficeDeptData error', err);
    res.status(500).json({ success: false, message: 'Failed to save officedept_data', error: err.message });
  } finally {
    connection.release();
  }
};

exports.getOfficeDeptData = async (req, res) => {
  try {
    const { academic_year, department, degree_level, year } = req.query;
    let q = `SELECT od.*, gm.name AS gender_name, cm.name AS category_name, scm.name AS subcategory_name
             FROM officedept_data od
             LEFT JOIN gender_master gm ON od.gender_id = gm.id
             LEFT JOIN category_master cm ON od.category_id = cm.id
             LEFT JOIN category_master scm ON od.subcategory_id = scm.id
             WHERE 1=1`;
    const params = [];
    if (academic_year) { q += ' AND od.academic_year = ?'; params.push(academic_year); }
    if (department) { q += ' AND od.department = ?'; params.push(department); }
    if (degree_level) { q += ' AND od.degree_level = ?'; params.push(degree_level); }
    if (year) { q += ' AND od.year = ?'; params.push(year); }
    q += ' ORDER BY od.category_id, od.subcategory_id, od.gender_id';
    const [rows] = await pool.query(q, params);
    res.json({ success: true, rows });
  } catch (err) {
    console.error('getOfficeDeptData error', err);
    res.status(500).json({ success: false, message: 'Failed to fetch officedept_data', error: err.message });
  }
};

exports.updateOfficeDeptData = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const { records } = req.body;
    if (!Array.isArray(records)) return res.status(400).json({ success: false, message: 'Invalid data' });

    for (const r of records) {
      if (r.id) {
        // Update without updated_at column if it doesn't exist
        await connection.query(
          `UPDATE officedept_data SET count = ?, status = ? WHERE id = ?`,
          [r.count || 0, r.status || 'Incompleted', r.id]
        );
      } else {
        console.warn('Skipping record without id in update:', r);
      }
    }

    await connection.commit();
    res.json({ success: true, message: 'Office dept data updated' });
  } catch (err) {
    await connection.rollback();
    console.error('updateOfficeDeptData error', err);
    res.status(500).json({ success: false, message: 'Failed to update officedept_data', error: err.message });
  } finally {
    connection.release();
  }
};

// Get lock status for Department Enrollment
exports.getLockStatus = async (req, res) => {
  const { academic_year } = req.query;
  try {
    const [rows] = await pool.query(
      'SELECT is_locked FROM office_submission WHERE academic_year = ? AND type = ? ORDER BY id DESC LIMIT 1',
      [academic_year, 'Department Enrollment']
    );
    res.json({ isLocked: rows.length > 0 ? !!rows[0].is_locked : false });
  } catch (err) {
    console.error('getLockStatus error:', err);
    res.status(500).json({ error: err.message });
  }
};

// Final submission (lock) for Department Enrollment
exports.finalSubmit = async (req, res) => {
  try {
    const { academic_year, type = 'Department Enrollment', status = 'Completed', office_id, name } = req.body;

    // Try to infer office_id/name if not provided
    let inferredOfficeId = office_id || null;
    let inferredName = name || null;
    if (!inferredOfficeId || !inferredName) {
      try {
        const [urows] = await pool.query('SELECT office_id, name FROM office_users LIMIT 1');
        if (urows && urows.length > 0) {
          inferredOfficeId = inferredOfficeId || urows[0].office_id || null;
          inferredName = inferredName || urows[0].name || null;
        }
      } catch (e) {
        // ignore inference failure
      }
    }

    // Remove any duplicate submission records for same key (keeps single latest)
    await pool.query(
      'DELETE FROM office_submission WHERE academic_year = ? AND type = ? AND office_id <=> ? AND name <=> ?',
      [academic_year, type, inferredOfficeId, inferredName]
    );

    await pool.query(
      'INSERT INTO office_submission (academic_year, type, status, office_id, name, is_locked, submitted_at) VALUES (?, ?, ?, ?, ?, 1, NOW())',
      [academic_year, type, status, inferredOfficeId, inferredName]
    );

    res.json({ success: true, message: 'Final submission completed and locked.' });
  } catch (err) {
    console.error('finalSubmit error:', err);
    res.status(500).json({ success: false, message: 'Failed to complete final submission', error: err.message });
  }
};
