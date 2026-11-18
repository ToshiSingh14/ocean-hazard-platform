const Incident = require('../models/Incident');
const { calculateSeverity } = require('./severityScoring');
const { isWithinRadius, distanceMeters } = require('./clusteringService');

/**
 * Generate a concise, human-readable custom ID for an incident based on location/hazard.
 */
function generateIncidentCustomId(locationName = '', hazardType = '') {
  let prefix = 'INC';
  if (locationName && typeof locationName === 'string') {
    const clean = locationName.replace(/[^a-zA-Z]/g, '').toUpperCase();
    if (clean.length >= 3) {
      prefix = clean.substring(0, Math.min(clean.length, 6));
    }
  } else if (hazardType && typeof hazardType === 'string') {
    prefix = hazardType.substring(0, 4).toUpperCase();
  }

  const suffix = Math.floor(100 + Math.random() * 900);
  return `${prefix}-${suffix}`;
}

/**
 * Associates an incoming report with an existing incident, or spawns a new one.
 *
 * @param {Object} report - Persisted Mongoose Report document or plain object
 * @returns {Promise<Object>} The associated or newly created Incident document
 */
async function clusterReport(report) {
  if (!report || !report.location || !Array.isArray(report.location.coordinates)) {
    throw new Error('Report must have valid location coordinates for clustering');
  }

  const [repLng, repLat] = report.location.coordinates;
  const hazardType = report.hazardType || report.hazard?.type || 'coastal_flooding';
  const confidence = report.confidence !== undefined ? report.confidence : (report.hazard?.confidence || 0.85);
  const locationName = report.locationName || report.location.name || 'Coastal Incident Area';

  // Find active incidents matching the same hazard type
  const activeCandidates = await Incident.find({
    status: 'active',
    hazardType: hazardType
  });

  let matchedIncident = null;
  let minDistance = Infinity;

  for (const incident of activeCandidates) {
    const centroidCoords = incident.location?.centroid || incident.centroid?.coordinates;
    if (!Array.isArray(centroidCoords) || centroidCoords.length !== 2) continue;

    const threshold = incident.radiusMeters || incident.location?.radiusMeters || 2000;

    if (isWithinRadius([repLng, repLat], centroidCoords, threshold)) {
      const dist = distanceMeters([repLng, repLat], centroidCoords);
      if (dist < minDistance) {
        minDistance = dist;
        matchedIncident = incident;
      }
    }
  }

  if (matchedIncident) {
    // 1. Attach report to existing incident
    const reportRef = report.customId || report._id.toString();
    const existingIds = matchedIncident.reportIds || [];

    // Avoid duplicate IDs in reportIds array
    const idExists = existingIds.some(
      (id) => String(id) === String(reportRef) || String(id) === String(report._id)
    );

    if (!idExists) {
      matchedIncident.reportIds.push(reportRef);
      matchedIncident.reportCount = (matchedIncident.reportCount || existingIds.length) + 1;
    }

    // 2. Update centroid as moving average weighted by reportCount
    const oldCentroid = matchedIncident.location?.centroid || matchedIncident.centroid?.coordinates || [repLng, repLat];
    const n = matchedIncident.reportCount || 2;
    const newLng = Number(((oldCentroid[0] * (n - 1) + repLng) / n).toFixed(4));
    const newLat = Number(((oldCentroid[1] * (n - 1) + repLat) / n).toFixed(4));

    matchedIncident.centroid = {
      type: 'Point',
      coordinates: [newLng, newLat]
    };
    if (!matchedIncident.location) matchedIncident.location = {};
    matchedIncident.location.centroid = [newLng, newLat];

    // 3. Update timeline
    matchedIncident.lastReportedAt = new Date();

    // 4. Update aggregated confidence (average)
    const oldConfidence = matchedIncident.confidence || 0.85;
    matchedIncident.confidence = Number(((oldConfidence * (n - 1) + confidence) / n).toFixed(2));

    // 5. Recalculate dynamic severity using severityScoring
    matchedIncident.severity = calculateSeverity({
      confidence: matchedIncident.confidence,
      reportCount: matchedIncident.reportCount
    });

    await matchedIncident.save();

    // Link report back to this incident
    report.incidentId = matchedIncident.customId || matchedIncident._id.toString();
    await report.save();

    return matchedIncident;
  } else {
    // Spawn a brand new incident cluster
    const newCustomId = generateIncidentCustomId(locationName, hazardType);
    const initialSeverity = calculateSeverity({
      confidence,
      reportCount: 1
    });

    const reportRef = report.customId || report._id.toString();

    const newIncident = await Incident.create({
      customId: newCustomId,
      hazardType,
      severity: initialSeverity,
      confidence: Number(confidence.toFixed(2)),
      centroid: {
        type: 'Point',
        coordinates: [repLng, repLat]
      },
      location: {
        name: locationName,
        centroid: [repLng, repLat],
        radiusMeters: 1500
      },
      locationName,
      radiusMeters: 1500,
      reportCount: 1,
      reportIds: [reportRef],
      firstReportedAt: new Date(),
      lastReportedAt: new Date(),
      status: 'active',
      verificationStatus: 'unverified'
    });

    // Link report back to new incident
    report.incidentId = newIncident.customId || newIncident._id.toString();
    await report.save();

    return newIncident;
  }
}

module.exports = {
  clusterReport,
  generateIncidentCustomId
};
