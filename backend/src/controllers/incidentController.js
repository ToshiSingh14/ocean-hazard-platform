const mongoose = require('mongoose');
const Incident = require('../models/Incident');

async function getIncidents(req, res, next) {
  try {
    const incidents = await Incident.find().sort({ lastReportedAt: -1 });
    res.json({ success: true, count: incidents.length, data: incidents });
  } catch (error) {
    next(error);
  }
}

async function getIncidentById(req, res, next) {
  try {
    const isObjectId = mongoose.Types.ObjectId.isValid(req.params.id);
    const query = isObjectId
      ? { $or: [{ _id: req.params.id }, { customId: req.params.id }] }
      : { customId: req.params.id };

    const incident = await Incident.findOne(query);

    if (!incident) {
      return res.status(404).json({
        success: false,
        message: 'Incident not found'
      });
    }

    const Report = require('../models/Report');
    const reports = await Report.find({
      $or: [
        { incidentId: incident.customId },
        { incidentId: incident._id },
        { _id: { $in: incident.reportIds || [] } }
      ]
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        incident,
        reports
      }
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(404).json({
        success: false,
        message: 'Incident not found'
      });
    }
    next(error);
  }
}

async function createIncident(req, res, next) {
  try {
    const incident = await Incident.create(req.body);
    res.status(201).json({ success: true, data: incident });
  } catch (error) {
    next(error);
  }
}

async function updateIncident(req, res, next) {
  try {
    const isObjectId = mongoose.Types.ObjectId.isValid(req.params.id);
    const query = isObjectId
      ? { $or: [{ _id: req.params.id }, { customId: req.params.id }] }
      : { customId: req.params.id };

    const incident = await Incident.findOneAndUpdate(
      query,
      req.body,
      { new: true, runValidators: true }
    );

    if (!incident) {
      return res.status(404).json({
        success: false,
        message: 'Incident not found'
      });
    }

    res.json({ success: true, data: incident });
  } catch (error) {
    next(error);
  }
}

async function deleteIncident(req, res, next) {
  try {
    const isObjectId = mongoose.Types.ObjectId.isValid(req.params.id);
    const query = isObjectId
      ? { $or: [{ _id: req.params.id }, { customId: req.params.id }] }
      : { customId: req.params.id };

    const incident = await Incident.findOneAndDelete(query);

    if (!incident) {
      return res.status(404).json({
        success: false,
        message: 'Incident not found'
      });
    }

    res.json({ success: true, message: 'Incident deleted successfully' });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getIncidents,
  getIncidentById,
  createIncident,
  updateIncident,
  deleteIncident
};
