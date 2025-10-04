const express = require('express');
const router = express.Router();
const departmentUserController = require('../adminController/departmentUserController');

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

module.exports = router;