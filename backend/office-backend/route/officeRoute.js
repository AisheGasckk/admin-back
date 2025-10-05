const express = require('express');
const router = express.Router();
const { officeLogin, forgotOfficePassword, verifyOfficeOtp, resetOfficePassword } = require('../controllers/officeController');
const basicInformationController = require('../controllers/basicInformationController');
const nonTeachingCtrl = require('../controllers/nonteachingcontrol');
const teachingCtrl = require('../controllers/teachingcontrol');
const officeSubmissionController = require('../controllers/nonTeachingFinalController');
const teachingFinalController = require('../controllers/teachingFinalController');

// Debug middleware
router.use((req, res, next) => {
  console.log(`Office Route: ${req.method} ${req.originalUrl}`);
  next();
});

// Office routes
router.post('/office-login', officeLogin);
router.post('/office-forgot-password', forgotOfficePassword);
router.post('/office-verify-otp', verifyOfficeOtp);
router.post('/office-reset-password', resetOfficePassword);

// Basic Information routes
router.get('/basic-information', basicInformationController.getBasicInformation);
router.post('/basic-information', basicInformationController.saveBasicInformation);

// Office Details routes
router.get('/office-details', basicInformationController.getOfficeDetails);
router.post('/office-details', basicInformationController.saveOfficeDetails);
router.get('/institution-address', basicInformationController.getInstitutionAddress);
router.post('/institution-address', basicInformationController.saveInstitutionAddress);

// Non-Teaching Staff routes
router.get('/non-teaching-staff/dropdowns', nonTeachingCtrl.getNonTeachingDropdowns);
router.get('/non-teaching-staff', nonTeachingCtrl.getAllNonTeachingStaff);
router.post('/non-teaching-staff', nonTeachingCtrl.addNonTeachingStaff);
router.put('/non-teaching-staff/update-group', nonTeachingCtrl.updateNonTeachingStaffGroup);

// Teaching Staff routes
router.get('/teaching-staff', teachingCtrl.getAllTeachingStaff);
router.post('/teaching-staff', teachingCtrl.addTeachingStaff);
router.put('/teaching-staff/:id', teachingCtrl.updateTeachingStaff);
router.get('/teaching-staff/academic-year', teachingCtrl.getAcademicYear);
router.get('/teaching-staff/is-locked', teachingFinalController.getTeachingLockStatus);
router.post('/teaching-staff/final-submit', teachingFinalController.finalTeachingSubmit);

// Completion status for each group
router.get('/non-teaching-staff/completion-status', officeSubmissionController.getCompletionStatus);

// Lock status for academic year
router.get('/non-teaching-staff/is-locked', officeSubmissionController.getLockStatus);

// Final submission (lock + declaration)
router.post('/non-teaching-staff/final-submit', officeSubmissionController.finalSubmit);

module.exports = router;