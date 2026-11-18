const Incident = require('../models/Incident');

async function getHotspots(req, res, next) {
  try {
    const hotspots = await Incident.find({
      status: 'active',
      severity: { $in: ['high', 'critical'] }
    }).sort({ severity: -1, lastReportedAt: -1 });

    const formatted = hotspots.map((h) => {
      const coords = Array.isArray(h.location?.centroid)
        ? h.location.centroid
        : (Array.isArray(h.centroid?.coordinates)
            ? h.centroid.coordinates
            : [85.8312, 19.8135]);

      const base = h.toObject();
      return {
        ...base,
        id: h.customId || h._id.toString(),
        centroid: coords, // Guaranteed [longitude, latitude] array
        incidentCount: h.reportCount || 1,
        dominantHazard: h.hazardType,
        maxSeverity: h.severity,
        boundingRadiusMeters: h.radiusMeters || h.location?.radiusMeters || 3000,
        regionName: h.locationName || h.location?.name || 'Coastal Hotspot Area'
      };
    });

    res.json({
      success: true,
      count: formatted.length,
      data: formatted
    });
  } catch (error) {
    next(error);
  }
}

module.exports = { getHotspots };
