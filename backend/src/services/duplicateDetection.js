const Report = require('../models/Report');
const { isWithinRadius } = require('./clusteringService');

async function findDuplicateReport({
  text,
  coordinates,
  radiusMeters = 1000
}) {
  if (!Array.isArray(coordinates) || coordinates.length !== 2) {
    throw new Error('Valid [longitude, latitude] coordinates are required');
  }

  const recentReports = await Report.find({
    createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
  })
    .select('text location createdAt customId')
    .lean();

  const normalizedText = String(text || '').trim().toLowerCase();

  return recentReports.find((report) => {
    const reportText = String(report.text || '').trim().toLowerCase();
    const existingCoordinates = report.location?.coordinates;

    const sameText =
      normalizedText.length > 0 && reportText === normalizedText;

    const nearby =
      Array.isArray(existingCoordinates) &&
      isWithinRadius(coordinates, existingCoordinates, radiusMeters);

    return sameText && nearby;
  }) || null;
}

module.exports = { findDuplicateReport };
