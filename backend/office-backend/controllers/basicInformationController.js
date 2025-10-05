const { pool } = require('../../../Admin/backend/config/db');

// GET basic information
exports.getBasicInformation = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM basic_information LIMIT 1');
    if (!rows || rows.length === 0) {
      return res.status(200).json({ success: true, data: {} });
    }
    return res.status(200).json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('Error fetching basic information:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch basic information' });
  }
};

// SAVE/UPDATE basic information
exports.saveBasicInformation = async (req, res) => {
  try {
    const data = req.body;
    // Upsert logic: update if exists, else insert
    const [rows] = await pool.query('SELECT id FROM basic_information LIMIT 1');
    if (rows.length > 0) {
      await pool.query(
        `UPDATE basic_information SET ? WHERE id = ?`,
        [data, rows[0].id]
      );
    } else {
      await pool.query(
        `INSERT INTO basic_information SET ?`,
        [data]
      );
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to save basic information' });
  }
};

// GET office details
exports.getOfficeDetails = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM office_details LIMIT 1');
    if (!rows || rows.length === 0) {
      return res.status(200).json({ success: true, data: {} });
    }
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch office details' });
  }
};

// SAVE/UPDATE office details
exports.saveOfficeDetails = async (req, res) => {
  try {
    const data = req.body;
    const [rows] = await pool.query('SELECT id FROM office_details LIMIT 1');
    if (rows.length > 0) {
      await pool.query(`UPDATE office_details SET ? WHERE id = ?`, [data, rows[0].id]);
    } else {
      await pool.query(`INSERT INTO office_details SET ?`, [data]);
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to save office details' });
  }
};

// GET institution address
exports.getInstitutionAddress = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM institution_address LIMIT 1');
    if (!rows || rows.length === 0) {
      return res.status(200).json({ success: true, data: {} });
    }
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch institution address' });
  }
};

// SAVE/UPDATE institution address
exports.saveInstitutionAddress = async (req, res) => {
  try {
    const data = req.body;
    const [rows] = await pool.query('SELECT id FROM institution_address LIMIT 1');
    if (rows.length > 0) {
      await pool.query(`UPDATE institution_address SET ? WHERE id = ?`, [data, rows[0].id]);
    } else {
      await pool.query(`INSERT INTO institution_address SET ?`, [data]);
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to save institution address' });
  }
};
