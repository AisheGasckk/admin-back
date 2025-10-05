const express = require('express');
const router = express.Router();
const officedeptCtrl = require('../controllers/officedeptControl');

// debug
router.use((req, res, next) => {
  console.log(`OfficeDept Route: ${req.method} ${req.originalUrl}`);
  next();
});

// Office dept routes mounted at /api/office/officedept
// GET  /office-user-year    -> returns academic_year from office_users (readonly box)
router.get('/office-user-year', officedeptCtrl.getOfficeUserAcademicYear);

// POST /create             -> create / upsert rows into officedept_data
router.post('/create', officedeptCtrl.createOfficeDeptData);

// GET  /get                -> fetch existing officedept_data (used by Edit/Load)
router.get('/get', officedeptCtrl.getOfficeDeptData);

// PUT  /update             -> update existing officedept_data rows (optional)
router.put('/update', officedeptCtrl.updateOfficeDeptData);

// NEW: GET lock status for Department Enrollment
router.get('/is-locked', officedeptCtrl.getLockStatus);

// NEW: Final submission (lock + declaration) for Department Enrollment
router.post('/final-submit', officedeptCtrl.finalSubmit);

module.exports = router;