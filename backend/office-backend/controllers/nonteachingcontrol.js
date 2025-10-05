const { pool } = require('../../../Admin/backend/config/db'); // Corrected path

// Get dropdown options for staff_type, staff_group, category, subcategory, gender
exports.getNonTeachingDropdowns = async (req, res) => {
  try {
    const [staffTypes] = await pool.query('SELECT DISTINCT staff_type FROM non_teaching_staff');
    const [groups] = await pool.query('SELECT DISTINCT staff_group FROM non_teaching_staff');
    const [categories] = await pool.query('SELECT id, name FROM category_master WHERE type="Category"');
    const [subcategories] = await pool.query('SELECT id, name FROM category_master WHERE type="Subcategory"');
    const [genders] = await pool.query('SELECT id, name FROM gender_master');
    res.json({
      success: true,
      staffTypes: staffTypes.map(r => r.staff_type),
      groups: groups.map(r => r.staff_group),
      categories,
      subcategories,
      genders
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch dropdowns', error: error.message });
  }
};

// Get all non-teaching staff records
exports.getAllNonTeachingStaff = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT nts.*, 
        cm.name AS category, 
        scm.name AS subcategory, 
        gm.name AS gender
      FROM non_teaching_staff nts
      JOIN category_master cm ON nts.category_id = cm.id
      LEFT JOIN category_master scm ON nts.subcategory_id = scm.id
      JOIN gender_master gm ON nts.gender_id = gm.id
      ORDER BY nts.staff_group, nts.staff_type, cm.id, scm.id, gm.id
    `);
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch non-teaching staff', error: error.message });
  }
};

// Add new non-teaching staff record(s)
exports.addNonTeachingStaff = async (req, res) => {
  try {
    const { records } = req.body;
    if (!Array.isArray(records)) {
      return res.status(400).json({ success: false, message: 'Invalid data format' });
    }
    let firstRecord = true;
    for (const record of records) {
      const {
        staff_type,
        staff_group,
        category_id,
        subcategory_id,
        gender_id,
        filled_count,
        academic_year,
        sanctioned_strength
      } = record;
      if (filled_count > 0) {
        await pool.query(
          `INSERT INTO non_teaching_staff 
            (staff_type, staff_group, category_id, subcategory_id, gender_id, filled_count, academic_year, sanctioned_strength)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            staff_type,
            staff_group,
            category_id,
            subcategory_id,
            gender_id,
            filled_count,
            academic_year,
            firstRecord ? sanctioned_strength : 0
          ]
        );
        firstRecord = false;
      }
    }
    res.json({ success: true, message: 'Non-teaching staff records added successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to add non-teaching staff', error: error.message });
  }
};

// Update non-teaching staff record
exports.updateNonTeachingStaff = async (req, res) => {
  try {
    const { id } = req.params;
    const { staff_type, staff_group, category_id, subcategory_id, gender_id, sanctioned_strength, filled_count } = req.body;
    await pool.query(
      `UPDATE non_teaching_staff SET staff_type=?, staff_group=?, category_id=?, subcategory_id=?, gender_id=?, sanctioned_strength=?, filled_count=? WHERE id=?`,
      [staff_type, staff_group, category_id, subcategory_id, gender_id, sanctioned_strength, filled_count, id]
    );
    res.json({ success: true, message: 'Non-teaching staff record updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update non-teaching staff', error: error.message });
  }
};

// Delete non-teaching staff record
exports.deleteNonTeachingStaff = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM non_teaching_staff WHERE id = ?', [id]);
    res.json({ success: true, message: 'Non-teaching staff record deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete non-teaching staff', error: error.message });
  }
};

// Batch update all records for a group and academic year
exports.updateNonTeachingStaffGroup = async (req, res) => {
  try {
    const { records, staff_group, academic_year } = req.body;
    if (!Array.isArray(records) || !staff_group || !academic_year) {
      return res.status(400).json({ success: false, message: 'Invalid data format' });
    }
    await pool.query(
      'DELETE FROM non_teaching_staff WHERE staff_group = ? AND academic_year = ?',
      [staff_group, academic_year]
    );
    let firstRecord = true;
    for (const record of records) {
      const {
        staff_type,
        staff_group,
        category_id,
        subcategory_id,
        gender_id,
        filled_count,
        academic_year,
        sanctioned_strength
      } = record;
      if (filled_count > 0) {
        await pool.query(
          `INSERT INTO non_teaching_staff 
            (staff_type, staff_group, category_id, subcategory_id, gender_id, filled_count, academic_year, sanctioned_strength)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            staff_type,
            staff_group,
            category_id,
            subcategory_id,
            gender_id,
            filled_count,
            academic_year,
            firstRecord ? sanctioned_strength : 0
          ]
        );
        firstRecord = false;
      }
    }
    res.json({ success: true, message: 'Enrollment data updated successfully!' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update enrollment data', error: error.message });
  }
};

// Add/update sanctioned strength for staff_type, staff_group, academic_year
exports.addSanctionedStrength = async (req, res) => {
  try {
    const { staff_type, staff_group, academic_year, sanctioned_strength } = req.body;
    // Upsert logic: update if exists, else insert
    const [existing] = await pool.query(
      'SELECT id FROM sanctioned_strength WHERE staff_type=? AND staff_group=? AND academic_year=?',
      [staff_type, staff_group, academic_year]
    );
    if (existing.length > 0) {
      await pool.query(
        'UPDATE sanctioned_strength SET sanctioned_strength=? WHERE staff_type=? AND staff_group=? AND academic_year=?',
        [sanctioned_strength, staff_type, staff_group, academic_year]
      );
    } else {
      await pool.query(
        'INSERT INTO sanctioned_strength (staff_type, staff_group, academic_year, sanctioned_strength) VALUES (?, ?, ?, ?)',
        [staff_type, staff_group, academic_year, sanctioned_strength]
      );
    }
    res.json({ success: true, message: 'Sanctioned strength saved successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to save sanctioned strength', error: error.message });
  }
};