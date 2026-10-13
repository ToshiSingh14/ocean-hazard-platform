const express = require('express');
const { getHotspots } = require('../controllers/hotspotController');

const router = express.Router();

router.get('/', getHotspots);

module.exports = router;
