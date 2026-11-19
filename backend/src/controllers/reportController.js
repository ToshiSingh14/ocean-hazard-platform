const mongoose = require('mongoose');
const Report = require('../models/Report');
const { clusterReport } = require('../services/incidentClusterService');
const { findDuplicateReport } = require('../services/duplicateDetection');
const { analyzeText } = require('../services/nlpService');

async function getReports(req, res, next) {
  try {
    const reports = await Report.find().sort({ createdAt: -1 });
    res.json({ success: true, count: reports.length, data: reports });
  } catch (error) {
    next(error);
  }
}

async function getReportById(req, res, next) {
  try {
    const isObjectId = mongoose.Types.ObjectId.isValid(req.params.id);
    const query = isObjectId
      ? { $or: [{ _id: req.params.id }, { customId: req.params.id }] }
      : { customId: req.params.id };

    const report = await Report.findOne(query);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    res.json({ success: true, data: report });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }
    next(error);
  }
}

async function createReport(req, res, next) {
  try {
    const body = { ...req.body };
    if (!body.customId) {
      body.customId = `RPT-${Math.floor(10000 + Math.random() * 90000)}`;
    }

    // 1. NLP Analysis pipeline execution
    let nlpAnalysis = null;
    if (body.text && typeof body.text === 'string' && body.text.trim()) {
      try {
        const userProvidedCoords = Array.isArray(body.coordinates)
          ? body.coordinates
          : (body.location?.coordinates || null);

        nlpAnalysis = await analyzeText(body.text, {
          coordinates: userProvidedCoords,
          locationName: body.locationName || body.locationText || null
        });
      } catch (nlpErr) {
        console.warn('[NLP Analysis Warning] Failed to run NLP analysis:', nlpErr.message);
      }
    }

    // 2. Resolve hazard type and confidence
    // If citizen manually selected hazardType, respect citizen input; otherwise use NLP prediction
    if (!body.hazardType && nlpAnalysis?.hazard_type) {
      body.hazardType = nlpAnalysis.hazard_type;
    } else if (!body.hazardType) {
      body.hazardType = 'coastal_flooding';
    }

    if (body.confidence === undefined || body.confidence === null) {
      body.confidence = nlpAnalysis?.confidence !== undefined ? nlpAnalysis.confidence : 0.85;
    }

    if (!body.secondaryHazardTypes && nlpAnalysis?.secondary_hazard_types) {
      body.secondaryHazardTypes = nlpAnalysis.secondary_hazard_types;
    }

    if (!body.hazard) {
      body.hazard = {
        type: body.hazardType,
        secondaryTypes: body.secondaryHazardTypes || [],
        confidence: body.confidence
      };
    }

    // Severity resolution: prioritize explicit input, then NLP assessment, then fallback
    if (!body.severity) {
      body.severity = nlpAnalysis?.severity || 'medium';
    }

    // 3. Location Resolution (Strict Priority Rule: GPS/User Coordinates > Text Extraction)
    let resolvedCoords = null;
    let resolvedLocationName = body.locationName || body.locationText || null;
    let locationSource = 'unresolved';

    // Rule 1: Explicit user-provided coordinates (GPS pin / map click)
    if (Array.isArray(body.coordinates) && body.coordinates.length === 2) {
      resolvedCoords = body.coordinates;
      locationSource = 'gps';
    } else if (Array.isArray(body.location?.coordinates) && body.location.coordinates.length === 2) {
      resolvedCoords = body.location.coordinates;
      locationSource = body.location.source || 'gps';
    } else if (nlpAnalysis?.location?.resolved && Array.isArray(nlpAnalysis.location.coordinates)) {
      // Rule 2: NLP Text-extracted coastal coordinates
      resolvedCoords = nlpAnalysis.location.coordinates;
      resolvedLocationName = resolvedLocationName || nlpAnalysis.location.name;
      locationSource = 'extracted';
    }

    // Default to fallback coastal location if completely unresolved
    if (!resolvedCoords) {
      resolvedCoords = [85.8312, 19.8135]; // Default Puri coastline anchor
      resolvedLocationName = resolvedLocationName || 'Puri Coastal Area';
      locationSource = 'extracted';
    }

    body.locationName = resolvedLocationName || 'Coastal Area';
    body.location = {
      type: 'Point',
      coordinates: resolvedCoords,
      name: body.locationName,
      raw: body.locationText || body.text?.substring(0, 80) || '',
      source: locationSource
    };

    // 4. Duplicate check: checks if an identical description was submitted nearby within 24h
    let isDuplicate = false;
    let duplicateOf = null;
    if (body.text && body.location?.coordinates) {
      try {
        const dup = await findDuplicateReport({
          text: body.text,
          coordinates: body.location.coordinates,
          radiusMeters: 1000
        });
        if (dup) {
          isDuplicate = true;
          duplicateOf = dup.customId || dup._id.toString();
        }
      } catch (dupErr) {
        console.warn('[Duplicate Check] Skipped:', dupErr.message);
      }
    }

    // 5. Persist Report in MongoDB
    const report = await Report.create(body);

    // 6. Automated Spatial Clustering Engine: associates with existing incident or spawns new one
    let clusteredIncident = null;
    try {
      clusteredIncident = await clusterReport(report);
    } catch (clusterErr) {
      console.error('[Clustering Error]:', clusterErr.message);
    }

    // 7. Structured classification payload maintaining full compatibility with frontend
    const classification = {
      hazardType: report.hazardType,
      secondaryTypes: report.secondaryHazardTypes || [],
      confidence: report.confidence,
      extractedLocation: {
        text: report.location?.raw || report.locationName,
        resolved: report.locationName,
        coordinates: report.location?.coordinates,
        source: report.location?.source
      },
      nlpMetadata: nlpAnalysis?.metadata || null,
      nlpSeverity: nlpAnalysis?.severity_assessment || null
    };

    res.status(201).json({
      success: true,
      report,
      incident: clusteredIncident,
      classification,
      isDuplicate,
      duplicateOf,
      data: report
    });
  } catch (error) {
    next(error);
  }
}

async function analyzeReportPreview(req, res, next) {
  try {
    const { text, coordinates, locationName } = req.body;
    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Text is required for NLP analysis preview'
      });
    }

    const analysis = await analyzeText(text, { coordinates, locationName });
    res.json({
      success: true,
      analysis
    });
  } catch (error) {
    next(error);
  }
}

async function updateReport(req, res, next) {
  try {
    const isObjectId = mongoose.Types.ObjectId.isValid(req.params.id);
    const query = isObjectId
      ? { $or: [{ _id: req.params.id }, { customId: req.params.id }] }
      : { customId: req.params.id };

    const report = await Report.findOneAndUpdate(
      query,
      req.body,
      { new: true, runValidators: true }
    );

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    res.json({ success: true, data: report });
  } catch (error) {
    next(error);
  }
}

async function deleteReport(req, res, next) {
  try {
    const isObjectId = mongoose.Types.ObjectId.isValid(req.params.id);
    const query = isObjectId
      ? { $or: [{ _id: req.params.id }, { customId: req.params.id }] }
      : { customId: req.params.id };

    const report = await Report.findOneAndDelete(query);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    res.json({ success: true, message: 'Report deleted successfully' });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getReports,
  getReportById,
  createReport,
  analyzeReportPreview,
  updateReport,
  deleteReport
};
