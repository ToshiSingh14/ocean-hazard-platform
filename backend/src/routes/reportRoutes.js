const express = require('express');
const {
  getReports,
  getReportById,
  createReport,
  analyzeReportPreview,
  updateReport,
  deleteReport
} = require('../controllers/reportController');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/', getReports);

// Preview NLP analysis endpoint
router.post('/analyze', analyzeReportPreview);

router.get('/:id', getReportById);

// Citizen report submission in Phase 1 & 2 is unauthenticated
router.post('/', createReport);
router.put('/:id', requireAuth, requireRole('admin'), updateReport);
router.patch('/:id', requireAuth, requireRole('admin'), updateReport);
router.delete('/:id', requireAuth, requireRole('admin'), deleteReport);

module.exports = router;
