const mongoose = require('mongoose');
const Report = require('../models/Report');
const { clusterReport } = require('../services/incidentClusterService');
const { findDuplicateReport } = require('../services/duplicateDetection');

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

    // Adapt coordinates if sent as body.coordinates [lng, lat]
    if (Array.isArray(body.coordinates) && !body.location) {
      body.location = {
        type: 'Point',
        coordinates: body.coordinates,
        name: body.locationName || body.locationText || 'Coastal Location',
        raw: body.locationText || '',
        source: body.locationSource || 'extracted'
      };
    }

    if (body.hazardType && !body.hazard) {
      body.hazard = {
        type: body.hazardType,
        secondaryTypes: [],
        confidence: 0.9
      };
    }

    // Duplicate check: checks if an identical description was submitted nearby within 24h
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

    const report = await Report.create(body);

    // Automated Spatial Clustering Engine: associates with existing incident or spawns new one
    let clusteredIncident = null;
    try {
      clusteredIncident = await clusterReport(report);
    } catch (clusterErr) {
      console.error('[Clustering Error]:', clusterErr.message);
    }

    const classification = {
      hazardType: report.hazardType || 'coastal_flooding',
      secondaryTypes: report.secondaryHazardTypes || [],
      confidence: report.confidence || 0.88,
      extractedLocation: {
        text: report.location?.raw || report.locationName || 'Shoreline',
        resolved: report.locationName || report.location?.name || 'Shoreline',
        coordinates: report.location?.coordinates || [85.8312, 19.8135]
      }
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
  updateReport,
  deleteReport
};
