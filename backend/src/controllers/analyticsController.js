const Incident = require('../models/Incident');
const Report = require('../models/Report');

async function getAnalytics(req, res, next) {
  try {
    const [
      totalIncidents,
      activeIncidents,
      totalReports,
      severityStats,
      hazardStats
    ] = await Promise.all([
      Incident.countDocuments(),
      Incident.countDocuments({ status: 'active' }),
      Report.countDocuments(),
      Incident.aggregate([
        { $group: { _id: '$severity', count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ]),
      Incident.aggregate([
        { $group: { _id: '$hazardType', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ])
    ]);

    res.json({
      success: true,
      data: {
        totalIncidents,
        activeIncidents,
        totalReports,
        severityBreakdown: severityStats,
        hazardBreakdown: hazardStats
      }
    });
  } catch (error) {
    next(error);
  }
}

module.exports = { getAnalytics };
