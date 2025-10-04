const express = require('express');
const router = express.Router();
const {
  getAllOfficeUsers,
  addOfficeUser,
  updateOfficeUser,
  deleteOfficeUser,
  toggleLockOfficeUser
} = require('../adminController/officeusercontroller');
const officeDetailsController = require('../adminController/officedetailscontroller');
const { pool } = require('../../config/db'); // <-- Add this line

router.get('/office-users', getAllOfficeUsers);
router.post('/', addOfficeUser);
router.put('/:id', updateOfficeUser);
router.delete('/:id', deleteOfficeUser);
router.patch('/:id/lock', toggleLockOfficeUser);
// Teaching staff details
router.get('/office-details/teaching', officeDetailsController.getTeachingDetails);

// Non-teaching staff details
router.get('/office-details/nonteaching', officeDetailsController.getNonTeachingDetails);

// Office submission details
router.get('/office-submission', officeDetailsController.getOfficeSubmissionDetails);

// Office submission lock/unlock and delete
router.patch('/office-submission/:id/lock', async (req, res) => {
  const { id } = req.params;
  const { locked } = req.body;
  try {
    const [result] = await pool.query('UPDATE office_submission SET is_locked = ? WHERE id = ?', [locked ? 1 : 0, id]);
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Submission not found' });
    res.json({ success: true, message: `Submission ${locked ? 'locked' : 'unlocked'} successfully` });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update lock status', error: error.message });
  }
});

router.delete('/office-submission/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await pool.query('DELETE FROM office_submission WHERE id = ?', [id]);
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Submission not found' });
    res.json({ success: true, message: 'Submission deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete submission', error: error.message });
  }
});

module.exports = router;