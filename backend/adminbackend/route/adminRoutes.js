const express = require('express');
const router = express.Router();
const {
  getAllAdmins,
  getAdminById,
  updateAdmin,
  addAdmin,
  deleteAdmin,
  updateAcademicYearForAll,
  getMaintenanceStatus,
  setMaintenanceStatus,
} = require('../adminController/adminController');

// Admin management routes
router.get('/all', getAllAdmins); // Fetch all admins
router.get('/:id', getAdminById); // Fetch admin by ID
router.put('/:id', updateAdmin); // Update admin details
router.post('/', addAdmin); // Add a new admin
router.delete('/:id', deleteAdmin); // Delete an admin
// Update academic year for all users
router.post('/update-academic-year', updateAcademicYearForAll);

// Maintenance mode (toggle by Nodal Officer)
router.get('/maintenance', getMaintenanceStatus);
router.post('/maintenance', setMaintenanceStatus);

module.exports = router;