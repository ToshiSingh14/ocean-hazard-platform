const mongoose = require('mongoose');
const Incident = require('../models/Incident');
const Report = require('../models/Report');
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

/**
 * Merge secondary incidents into a primary incident.
 */
async function mergeIncidentsLogic({ primaryIncidentId, secondaryIncidentIds = [], resolutionNote }) {
  if (!primaryIncidentId || !Array.isArray(secondaryIncidentIds) || secondaryIncidentIds.length === 0) {
    throw new Error('Primary incident ID and at least one secondary incident ID are required for merge');
  }

  // Find primary incident
  const isPrimaryObjId = mongoose.Types.ObjectId.isValid(primaryIncidentId);
  const primaryQuery = isPrimaryObjId
    ? { $or: [{ _id: primaryIncidentId }, { customId: primaryIncidentId }] }
    : { customId: primaryIncidentId };
  const primaryIncident = await Incident.findOne(primaryQuery);

  if (!primaryIncident) {
    throw new Error(`Primary incident ${primaryIncidentId} not found`);
  }

  // Find secondary incidents
  const secondaryObjFilter = secondaryIncidentIds.filter((id) => mongoose.Types.ObjectId.isValid(id));
  const secondaryQuery = secondaryObjFilter.length > 0
    ? { $or: [{ customId: { $in: secondaryIncidentIds } }, { _id: { $in: secondaryObjFilter } }] }
    : { customId: { $in: secondaryIncidentIds } };

  const secondaryIncidents = await Incident.find(secondaryQuery);

  if (secondaryIncidents.length === 0) {
    throw new Error('None of the specified secondary incidents could be found');
  }

  const secondaryCustomIds = secondaryIncidents.map((s) => s.customId).filter(Boolean);
  const secondaryObjIds = secondaryIncidents.map((s) => s._id);

  // Collect valid ObjectIds from primary reportIds
  const primaryReportObjIds = (primaryIncident.reportIds || []).filter((id) =>
    mongoose.Types.ObjectId.isValid(id)
  );
  const primaryReportCustomIds = (primaryIncident.reportIds || []).map(String);

  // Find all reports belonging to either primary or secondary incidents
  const allReportsQuery = [
    { incidentId: primaryIncident.customId },
    { incidentId: primaryIncident._id },
    { customId: { $in: primaryReportCustomIds } }
  ];
  if (primaryReportObjIds.length > 0) {
    allReportsQuery.push({ _id: { $in: primaryReportObjIds } });
  }
  if (secondaryCustomIds.length > 0) {
    allReportsQuery.push({ incidentId: { $in: secondaryCustomIds } });
  }
  if (secondaryObjIds.length > 0) {
    allReportsQuery.push({ incidentId: { $in: secondaryObjIds } });
  }

  const allReports = await Report.find({ $or: allReportsQuery });

  // Re-link all secondary reports to primary incident
  const targetIncidentRef = primaryIncident.customId || primaryIncident._id.toString();
  const relinkFilters = [];
  if (secondaryCustomIds.length > 0) {
    relinkFilters.push({ incidentId: { $in: secondaryCustomIds } });
  }
  if (secondaryObjIds.length > 0) {
    relinkFilters.push({ incidentId: { $in: secondaryObjIds } });
  }

  if (relinkFilters.length > 0) {
    await Report.updateMany(
      { $or: relinkFilters },
      { $set: { incidentId: targetIncidentRef } }
    );
  }

  // Build merged reportIds array and compute new centroid
  const distinctReportIds = [];
  let sumLng = 0;
  let sumLat = 0;
  let validCoordCount = 0;
  let totalConfidence = 0;

  allReports.forEach((rep) => {
    const rId = rep.customId || rep._id.toString();
    if (!distinctReportIds.includes(rId)) {
      distinctReportIds.push(rId);
    }

    const coords = rep.location?.coordinates;
    if (Array.isArray(coords) && coords.length === 2) {
      sumLng += coords[0];
      sumLat += coords[1];
      validCoordCount++;
    }

    totalConfidence += rep.confidence || rep.hazard?.confidence || 0.85;
  });

  const count = Math.max(distinctReportIds.length, 1);
  const avgLng = validCoordCount > 0 ? Number((sumLng / validCoordCount).toFixed(4)) : primaryIncident.centroid.coordinates[0];
  const avgLat = validCoordCount > 0 ? Number((sumLat / validCoordCount).toFixed(4)) : primaryIncident.centroid.coordinates[1];
  const avgConfidence = Number((totalConfidence / count).toFixed(2));

  primaryIncident.reportIds = distinctReportIds;
  primaryIncident.reportCount = count;
  primaryIncident.centroid = { type: 'Point', coordinates: [avgLng, avgLat] };
  if (!primaryIncident.location) primaryIncident.location = {};
  primaryIncident.location.centroid = [avgLng, avgLat];
  primaryIncident.confidence = avgConfidence;
  primaryIncident.severity = calculateSeverity({ confidence: avgConfidence, reportCount: count });
  primaryIncident.lastReportedAt = new Date();

  await primaryIncident.save();

  // Delete the secondary incidents
  await Incident.deleteMany({
    _id: { $in: secondaryObjIds }
  });

  return {
    primaryIncident,
    mergedCount: secondaryIncidents.length,
    totalReports: count
  };
}

/**
 * Split selected reports from a source incident into a new incident cluster.
 */
async function splitIncidentLogic({
  sourceIncidentId,
  reportIdsToExtract = [],
  newIncidentLocationName,
  newHazardType
}) {
  if (!sourceIncidentId || !Array.isArray(reportIdsToExtract) || reportIdsToExtract.length === 0) {
    throw new Error('Source incident ID and at least one report ID to extract are required for split');
  }

  // Find source incident
  const isSourceObjId = mongoose.Types.ObjectId.isValid(sourceIncidentId);
  const sourceQuery = isSourceObjId
    ? { $or: [{ _id: sourceIncidentId }, { customId: sourceIncidentId }] }
    : { customId: sourceIncidentId };
  const sourceIncident = await Incident.findOne(sourceQuery);

  if (!sourceIncident) {
    throw new Error(`Source incident ${sourceIncidentId} not found`);
  }

  // Find reports to extract safely guarding ObjectId casting
  const validExtractObjIds = reportIdsToExtract.filter((id) => mongoose.Types.ObjectId.isValid(id));
  const extractQuery = validExtractObjIds.length > 0
    ? { $or: [{ customId: { $in: reportIdsToExtract } }, { _id: { $in: validExtractObjIds } }] }
    : { customId: { $in: reportIdsToExtract } };

  const reportsToExtract = await Report.find(extractQuery);

  if (reportsToExtract.length === 0) {
    throw new Error('None of the specified reports could be found to extract');
  }

  // Validate that source incident will retain at least one report
  const validSourceReportObjIds = (sourceIncident.reportIds || []).filter((id) =>
    mongoose.Types.ObjectId.isValid(id)
  );
  const sourceReportCustomIds = (sourceIncident.reportIds || []).map(String);

  const allSourceQuery = [
    { incidentId: sourceIncident.customId },
    { incidentId: sourceIncident._id },
    { customId: { $in: sourceReportCustomIds } }
  ];
  if (validSourceReportObjIds.length > 0) {
    allSourceQuery.push({ _id: { $in: validSourceReportObjIds } });
  }

  const allSourceReports = await Report.find({ $or: allSourceQuery });

  const extractedKeys = new Set(reportsToExtract.map((r) => r.customId || r._id.toString()));
  const remainingReports = allSourceReports.filter(
    (r) => !extractedKeys.has(r.customId) && !extractedKeys.has(r._id.toString())
  );

  if (remainingReports.length === 0) {
    throw new Error('Cannot extract all reports from the source incident. At least one report must remain.');
  }

  // Compute centroid and metadata for the new incident
  let newSumLng = 0;
  let newSumLat = 0;
  let newValidCoords = 0;
  let newSumConf = 0;

  reportsToExtract.forEach((r) => {
    const coords = r.location?.coordinates;
    if (Array.isArray(coords) && coords.length === 2) {
      newSumLng += coords[0];
      newSumLat += coords[1];
      newValidCoords++;
    }
    newSumConf += r.confidence || r.hazard?.confidence || 0.85;
  });

  const newCount = reportsToExtract.length;
  const newLng = newValidCoords > 0 ? Number((newSumLng / newValidCoords).toFixed(4)) : sourceIncident.centroid.coordinates[0];
  const newLat = newValidCoords > 0 ? Number((newSumLat / newValidCoords).toFixed(4)) : sourceIncident.centroid.coordinates[1];
  const newAvgConf = Number((newSumConf / newCount).toFixed(2));
  const newLocation = newIncidentLocationName || reportsToExtract[0]?.location?.name || 'Split Coastal Incident Zone';
  const hazard = newHazardType || reportsToExtract[0]?.hazardType || sourceIncident.hazardType;
  const newCustomId = generateIncidentCustomId(newLocation, hazard);

  const newIncident = await Incident.create({
    customId: newCustomId,
    hazardType: hazard,
    severity: calculateSeverity({ confidence: newAvgConf, reportCount: newCount }),
    confidence: newAvgConf,
    centroid: { type: 'Point', coordinates: [newLng, newLat] },
    location: {
      name: newLocation,
      centroid: [newLng, newLat],
      radiusMeters: 1500
    },
    locationName: newLocation,
    radiusMeters: 1500,
    reportCount: newCount,
    reportIds: reportsToExtract.map((r) => r.customId || r._id.toString()),
    firstReportedAt: reportsToExtract[0]?.createdAt || new Date(),
    lastReportedAt: new Date(),
    status: 'active',
    verificationStatus: 'unverified'
  });

  // Re-link extracted reports to new incident
  await Report.updateMany(
    { _id: { $in: reportsToExtract.map((r) => r._id) } },
    { $set: { incidentId: newIncident.customId } }
  );

  // Recalculate remaining reports for source incident
  let remSumLng = 0;
  let remSumLat = 0;
  let remValidCoords = 0;
  let remSumConf = 0;

  remainingReports.forEach((r) => {
    const coords = r.location?.coordinates;
    if (Array.isArray(coords) && coords.length === 2) {
      remSumLng += coords[0];
      remSumLat += coords[1];
      remValidCoords++;
    }
    remSumConf += r.confidence || r.hazard?.confidence || 0.85;
  });

  const remCount = remainingReports.length;
  const remLng = remValidCoords > 0 ? Number((remSumLng / remValidCoords).toFixed(4)) : sourceIncident.centroid.coordinates[0];
  const remLat = remValidCoords > 0 ? Number((remSumLat / remValidCoords).toFixed(4)) : sourceIncident.centroid.coordinates[1];
  const remAvgConf = Number((remSumConf / remCount).toFixed(2));

  sourceIncident.reportIds = remainingReports.map((r) => r.customId || r._id.toString());
  sourceIncident.reportCount = remCount;
  sourceIncident.centroid = { type: 'Point', coordinates: [remLng, remLat] };
  if (!sourceIncident.location) sourceIncident.location = {};
  sourceIncident.location.centroid = [remLng, remLat];
  sourceIncident.confidence = remAvgConf;
  sourceIncident.severity = calculateSeverity({ confidence: remAvgConf, reportCount: remCount });
  await sourceIncident.save();

  return {
    sourceIncident,
    newIncident,
    extractedCount: newCount,
    remainingCount: remCount
  };
}

module.exports = {
  clusterReport,
  generateIncidentCustomId,
  mergeIncidentsLogic,
  splitIncidentLogic
};
