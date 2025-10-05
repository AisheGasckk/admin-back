const { pool } = require('../../../Admin/backend/config/db');

// 1. Get completion status for each group
exports.getCompletionStatus = async (req, res) => {
  const { academic_year } = req.query;
  try {
    const [rows] = await pool.query(
      'SELECT DISTINCT staff_group FROM non_teaching_staff WHERE academic_year = ?',
      [academic_year]
    );
    const groups = rows.map(r => r.staff_group);
    res.json({
      "Group B": groups.includes("Group B"),
      "Group C": groups.includes("Group C"),
      "Group D": groups.includes("Group D")
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 2. Get lock status for academic year and type
exports.getLockStatus = async (req, res) => {
  const { academic_year } = req.query;
  try {
    const [rows] = await pool.query(
      'SELECT is_locked FROM office_submission WHERE academic_year = ? AND type = ? ORDER BY id DESC LIMIT 1',
      [academic_year, 'Non-Teaching Staff']
    );
    res.json({ isLocked: rows.length > 0 ? !!rows[0].is_locked : false });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 3. Final submission (lock)
exports.finalSubmit = async (req, res) => {
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

// 4. Get submission status
exports.getSubmissionStatus = async (req, res) => {
  const { academic_year } = req.query;
  try {
    const [rows] = await pool.query(
      'SELECT status FROM office_submission WHERE academic_year = ? AND type = ? ORDER BY id DESC LIMIT 1',
      [academic_year, 'Non-Teaching Staff']
    );
    res.json({ status: rows.length > 0 ? rows[0].status : 'Incompleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

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
  const { academic_year } = req.body;
  try {
    const [existing] = await pool.query(
      'SELECT id FROM office_submission WHERE academic_year = ? AND type = ?',
      [academic_year, 'Teaching Staff']
    );
    if (existing.length > 0) {
      await pool.query(
        'UPDATE office_submission SET is_locked = 1, status = ? WHERE academic_year = ? AND type = ?',
        ['Completed', academic_year, 'Teaching Staff']
      );
    } else {
      await pool.query(
        'INSERT INTO office_submission (academic_year, type, is_locked, status) VALUES (?, ?, 1, ?)',
        [academic_year, 'Teaching Staff', 'Completed']
      );
    }
    res.json({ success: true, message: "Final submission completed and locked." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Add this utility function
async function updateStatusIfAllGroupsCompleted(academic_year) {
  const [rows] = await pool.query(
    'SELECT DISTINCT staff_group FROM non_teaching_staff WHERE academic_year = ?',
    [academic_year]
  );
  const groups = rows.map(r => r.staff_group);
  if (["Group B", "Group C", "Group D"].every(g => groups.includes(g))) {
    await pool.query(
      'UPDATE office_submission SET status = ? WHERE academic_year = ? AND type = ?',
      ['Completed', academic_year, 'Non-Teaching Staff']
    );
  }
}