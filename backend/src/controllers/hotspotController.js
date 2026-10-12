const Incident = require('../models/Incident');

async function getHotspots(req, res, next) {
  try {
    const hotspots = await Incident.find({
      status: 'active',
      severity: { $in: ['high', 'critical'] }
    }).sort({ severity: -1, lastReportedAt: -1 });

    res.json({
      success: true,
      count: hotspots.length,
      data: hotspots
    });
  } catch (error) {
    next(error);
  }
}

module.exports = { getHotspots };
