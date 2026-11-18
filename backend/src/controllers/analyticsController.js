const Incident = require('../models/Incident');
const Report = require('../models/Report');

async function getAnalytics(req, res, next) {
  try {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [
      totalIncidents,
      activeIncidents,
      highSeverityIncidents,
      totalReports,
      reportsToday,
      severityStats,
      hazardStats,
      incidentGrowth,
      overTimeAgg,
      byRegionAgg
    ] = await Promise.all([
      Incident.countDocuments(),
      Incident.countDocuments({ status: 'active' }),
      Incident.countDocuments({ severity: { $in: ['high', 'critical'] } }),
      Report.countDocuments(),
      Report.countDocuments({ createdAt: { $gte: oneDayAgo } }),
      Incident.aggregate([
        { $group: { _id: '$severity', count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ]),
      Incident.aggregate([
        { $group: { _id: '$hazardType', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      Incident.find({ status: 'active' })
        .sort({ reportCount: -1 })
        .limit(5)
        .select('customId locationName reportCount'),
      Report.aggregate([
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } },
        { $project: { _id: 0, date: '$_id', count: 1 } }
      ]),
      Incident.aggregate([
        {
          $group: {
            _id: '$locationName',
            count: { $sum: '$reportCount' },
            highSeverityCount: {
              $sum: { $cond: [{ $in: ['$severity', ['high', 'critical']] }, 1, 0] }
            }
          }
        },
        { $sort: { count: -1 } },
        { $limit: 8 },
        { $project: { _id: 0, region: '$_id', count: 1, highSeverityCount: 1 } }
      ])
    ]);

    const byHazardType = {};
    hazardStats.forEach((h) => {
      byHazardType[h._id] = h.count;
    });

    const severityDistribution = severityStats.map((s) => ({
      severity: s._id,
      count: s.count,
      percentage: totalIncidents ? Math.round((s.count / totalIncidents) * 100) : 0
    }));

    const totals = {
      reports: totalReports,
      incidents: totalIncidents,
      activeIncidents,
      highSeverity: highSeverityIncidents,
      reportsToday: reportsToday || 0
    };

    const incidentGrowthRates = incidentGrowth.map((inc) => ({
      incidentId: inc.customId,
      region: inc.locationName || 'Coastal Area',
      reportsPerHour: parseFloat(((inc.reportCount || 1) / 4).toFixed(1)),
      trend: 'up'
    }));

    res.json({
      success: true,
      totals,
      byHazardType,
      overTime: overTimeAgg,
      byRegion: byRegionAgg,
      severityDistribution,
      incidentGrowthRates,
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
