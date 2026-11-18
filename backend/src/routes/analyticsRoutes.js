const express = require('express');
const { getAnalytics } = require('../controllers/analyticsController');

const router = express.Router();

router.get('/', getAnalytics);
router.get('/summary', getAnalytics);

module.exports = router;
