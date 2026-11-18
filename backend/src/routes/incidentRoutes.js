const express = require('express');
const {
  getIncidents,
  getIncidentById,
  createIncident,
  updateIncident,
  deleteIncident,
  mergeIncidents,
  splitIncident
} = require('../controllers/incidentController');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/', getIncidents);
router.get('/:id', getIncidentById);

router.post('/merge', requireAuth, requireRole('admin'), mergeIncidents);
router.post('/split', requireAuth, requireRole('admin'), splitIncident);

router.post('/', requireAuth, requireRole('admin'), createIncident);
router.put('/:id', requireAuth, requireRole('admin'), updateIncident);
router.patch('/:id/status', requireAuth, requireRole('admin'), updateIncident);
router.patch('/:id', requireAuth, requireRole('admin'), updateIncident);
router.delete('/:id', requireAuth, requireRole('admin'), deleteIncident);

module.exports = router;
