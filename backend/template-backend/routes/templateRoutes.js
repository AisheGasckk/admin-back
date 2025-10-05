const express = require('express');
const router = express.Router();
const templateController = require('../controllers/templateController'); // <-- FIXED PATH
const officeUserController = require('../../../Admin/backend/adminbackend/adminController/officeusercontroller');

router.get('/department-enrollment-summary', templateController.getDepartmentEnrollmentSummary);
router.get('/department-examination-summary', templateController.getDepartmentExaminationSummary);
router.get('/teaching-staff-summary', templateController.getTeachingStaffSummary);
router.get('/non-teaching-staff-summary', templateController.getNonTeachingStaffSummary);
router.get('/distinct-academic-years', officeUserController.getDistinctAcademicYears);

module.exports = router;