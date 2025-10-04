const express = require('express');
const router = express.Router();
const {
  getAllSubmittedData,
  toggleLockSubmittedData,
  deleteSubmittedData,
  getDistinctSubmittedAcademicYears // <-- Add this
} = require('../adminController/submittedUserController');

// GET all submitted data
router.get('/', getAllSubmittedData);

// GET distinct academic years from submitted_data
router.get('/distinct/years', getDistinctSubmittedAcademicYears);

// PATCH lock/unlock
router.patch('/:id/lock', toggleLockSubmittedData);

// DELETE a submitted entry
router.delete('/:id', deleteSubmittedData);

module.exports = router;