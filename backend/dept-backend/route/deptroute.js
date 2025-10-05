const express = require('express');
const router = express.Router();

const deptenrollment = require('../controllers/deptenrollment');
const deptexamination = require('../controllers/deptexamination');
const {
  departmentLogin,
  forgotDepartmentPassword,
  getHodName,
  verifyDepartmentOtp,
  resetDepartmentPassword
} = require('../controllers/deptcontroller');
const { pool } = require('../../config/db');

// Debug middleware
router.use((req, res, next) => {
  console.log(`Department Route: ${req.method} ${req.originalUrl}`);
  next();
});

// ==================== AUTH ROUTES ====================
router.post('/department-login', departmentLogin);
router.post('/department-forgot-password', forgotDepartmentPassword);
router.post('/department-verify-otp', verifyDepartmentOtp);
router.post('/department-reset-password', resetDepartmentPassword);

// ==================== STUDENT ENROLLMENT ROUTES ====================
// Add enrollment summary data
router.post('/enrollment-summary', deptenrollment.addEnrollmentData);
// Get student enrollment details for a department
router.get('/student-enrollment/department/:deptId', deptenrollment.getStudentDetails);
// Submit enrollment declaration
router.post('/student-enrollment/submit-declaration', deptenrollment.submitEnrollmentDeclaration);
// Update enrollment data
router.put('/student-enrollment/update', deptenrollment.updateEnrollmentData);
// Lock enrollment declaration
router.post('/student-enrollment/lock-declaration', deptenrollment.lockDeclaration);
// Get enrollment declaration lock status
router.get('/student-enrollment/declaration-lock-status', deptenrollment.getDeclarationLockStatus);
// Delete enrollment data by year
router.post('/student-enrollment/delete-by-year', deptenrollment.deleteEnrollmentByYear);
// Prevent GET on submit-declaration
router.get('/student-enrollment/submit-declaration', (req, res) => {
  res.status(405).json({
    success: false,
    message: 'Method not allowed. Use POST request instead.'
  });
});

// ==================== STUDENT EXAMINATION ROUTES ====================
// Add examination summary data
router.post('/examination-summary', deptexamination.addExaminationData);
// Get student examination details for a department
router.get('/student-examination/department/:deptId', deptexamination.getExaminationDetails);
// Update examination status for students
router.post('/student-examination/update-status', deptexamination.updateExaminationStatus);
// Submit examination declaration
router.post('/student-examination/submit-declaration', deptexamination.submitExaminationDeclaration);
// Get year-wise examination statuses
router.get('/student-examination/year-statuses/:deptId', deptexamination.getExaminationYearStatuses);
// Update examination data
router.put('/student-examination/update', deptexamination.updateExaminationData);
// Lock examination declaration
router.post('/student-examination/lock-declaration', deptexamination.lockDeclaration);
// Get examination declaration lock status
router.get('/student-examination/declaration-lock-status', deptexamination.getDeclarationLockStatus);

// ==================== DEPARTMENT USER ROUTES ====================
// Get academic years for department user
router.get('/department-user/academic-year/:deptId', async (req, res) => {
  try {
    const { deptId } = req.params;
    const [rows] = await pool.query(
      'SELECT academic_year FROM department_users WHERE dept_id = ?',
      [deptId]
    );
    if (rows.length === 0) {
      return res.json({ success: false, years: [] });
    }
    res.json({ success: true, years: rows.map(r => r.academic_year) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch academic year' });
  }
});

// Get HOD name for a department
router.get('/department-user/hod/:deptId', getHodName);
// Get allowed degree levels for a department
router.get('/degree-levels/:deptId', deptenrollment.getAllowedDegreeLevels);

module.exports = router;