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
    console.log('[DEBUG] Requested incident ID:', req.params.id);
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

    console.log('[DEBUG] Incident found:', incident.customId);
    console.log('[DEBUG] Fetching related reports...');

    const reports = await Report.find({
      $or: [
        { incidentId: incident.customId },
        { incidentId: incident._id }
      ]
    }).sort({ createdAt: -1 });
    // const reports = await Report.find({
    //   $or: [
    //     { incidentId: incident.customId },
    //     { incidentId: incident._id },
    //     { _id: { $in: incident.reportIds || [] } }
    //   ]
    // }).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        incident,
        reports
      }
    });
  } catch (error) {
    // if (error.name === 'CastError') {
    //   console.log("catch block is running")
    //   return res.status(404).json({
    //     success: false,
    //     message: 'Incident not found',
    //     error: error.message
    //   });
    // }
    // next(error);
    console.error('[INCIDENT ERROR]', error);
    console.error('Name:', error.name);
    console.error('Message:', error.message);
    console.error('Path:', error.path);
    console.error('Value:', error.value);
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
