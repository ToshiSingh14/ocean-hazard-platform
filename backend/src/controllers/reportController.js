const Report = require('../models/Report');

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
    const report = await Report.findOne({
      $or: [{ _id: req.params.id }, { customId: req.params.id }]
    });

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
    const report = await Report.create(req.body);
    res.status(201).json({ success: true, data: report });
  } catch (error) {
    next(error);
  }
}

async function updateReport(req, res, next) {
  try {
    const report = await Report.findOneAndUpdate(
      { $or: [{ _id: req.params.id }, { customId: req.params.id }] },
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
    const report = await Report.findOneAndDelete({
      $or: [{ _id: req.params.id }, { customId: req.params.id }]
    });

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
