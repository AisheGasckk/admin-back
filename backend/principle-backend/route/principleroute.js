const express = require('express');
const router = express.Router();
const { principleLogin, forgotPrinciplePassword, getDepartmentsList, getDepartmentDetails, verifyPrincipalOtp, resetPrincipalPassword } = require('../controllers/principlecontroller');
const principleOfficeController = require('../controllers/principleofficecontroller');

// Public routes
router.post('/login', principleLogin);
router.post('/forgot-password', forgotPrinciplePassword);
router.post('/verify-otp', verifyPrincipalOtp);
router.post('/reset-password', resetPrincipalPassword);
router.get('/departments-list', getDepartmentsList);
router.get('/department-details/:deptId', getDepartmentDetails);
router.get('/office-submission', principleOfficeController.getAllOfficeSubmissions);

module.exports = router;