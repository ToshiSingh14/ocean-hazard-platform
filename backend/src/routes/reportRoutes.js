const express = require('express');
const {
  getReports,
  getReportById,
  createReport,
  updateReport,
  deleteReport
} = require('../controllers/reportController');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/', getReports);
router.get('/:id', getReportById);

router.post('/', requireAuth, requireRole('admin'), createReport);
router.put('/:id', requireAuth, requireRole('admin'), updateReport);
router.patch('/:id', requireAuth, requireRole('admin'), updateReport);
router.delete('/:id', requireAuth, requireRole('admin'), deleteReport);

module.exports = router;
