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
    const incident = await Incident.findOne({
      $or: [{ _id: req.params.id }, { customId: req.params.id }]
    });

    if (!incident) {
      return res.status(404).json({
        success: false,
        message: 'Incident not found'
      });
    }

    res.json({ success: true, data: incident });
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
    const incident = await Incident.findOneAndUpdate(
      { $or: [{ _id: req.params.id }, { customId: req.params.id }] },
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
    const incident = await Incident.findOneAndDelete({
      $or: [{ _id: req.params.id }, { customId: req.params.id }]
    });

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
