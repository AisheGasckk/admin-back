const express = require('express');
const router = express.Router();
const departmentUserController = require('../adminController/departmentUserController');
const { pool } = require('../../config/db');

// Department user management routes
router.get('/', departmentUserController.getAllDepartmentUsers); // Fetch all department users
router.get('/:id', departmentUserController.getDepartmentUserById); // Fetch a department user by ID
router.post('/', departmentUserController.addDepartmentUser); // Create department user
router.put('/:id', departmentUserController.updateDepartmentUser); // Update an existing department user
router.delete('/:id', departmentUserController.deleteDepartmentUser); // Delete a department user
router.patch('/:id/lock', departmentUserController.toggleLockDepartmentUser); // Lock or unlock a department user
router.get('/distinct/years', departmentUserController.getDistinctAcademicYears); // Get distinct academic years
router.get('/student-enrollment/summary', departmentUserController.getStudentEnrollmentSummary); // Get student enrollment summary
router.get('/student-examination/summary', departmentUserController.getStudentExaminationSummary); // Get student examination summary
router.get('/details/:deptId', departmentUserController.getDepartmentUserDetails); // Get details of a specific department user

// ADD THESE MISSING ROUTES:
// Get academic year for a department
router.get('/academic-year/:deptId', async (req, res) => {
  try {
    const { deptId } = req.params;
    const [rows] = await pool.query(
      'SELECT academic_year FROM department_users WHERE dept_id = ? ORDER BY academic_year DESC LIMIT 1',
      [deptId]
    );
    
    if (rows.length === 0) {
      return res.json({ success: false, years: [] });
    }
    
    res.json({ success: true, academic_year: rows[0].academic_year });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch academic year' });
  }
});

// Get HOD name for a department
router.get('/hod/:deptId', async (req, res) => {
  try {
    const { deptId } = req.params;
    if (!deptId) {
      return res.status(400).json({ success: false, message: 'Department ID is required' });
    }
    
    const [rows] = await pool.query(
      'SELECT hod FROM department_users WHERE dept_id = ? ORDER BY academic_year DESC LIMIT 1',
      [deptId]
    );
    
    if (rows.length === 0 || !rows[0].hod) {
      return res.json({ success: false, hod_name: null, message: 'HOD name not found' });
    }
    
    res.json({ success: true, hod_name: rows[0].hod });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch HOD name', error: error.message });
  }
});

// Get degree levels for a department
router.get('/degree-levels/:deptId', async (req, res) => {
  try {
    const { deptId } = req.params;
    if (!deptId) {
      return res.status(400).json({ success: false, message: 'Department ID is required' });
    }
    
    const [rows] = await pool.query(
      'SELECT DISTINCT degree_level FROM department_users WHERE dept_id = ?',
      [deptId]
    );
    
    const degreeLevels = rows.map(r => r.degree_level).filter(Boolean);
    res.json({ success: true, degree_levels: degreeLevels });
  } catch (error) {
    console.error('Error fetching degree levels:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch degree levels', error: error.message });
  }
});

module.exports = router;