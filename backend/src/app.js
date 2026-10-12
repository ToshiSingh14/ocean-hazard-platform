const express = require('express');
const cors = require('cors');
const { CLIENT_ORIGIN } = require('./config/env');
const {
  notFoundHandler,
  errorHandler
} = require('./middleware/errorHandler');

const incidentRoutes = require('./routes/incidentRoutes');
const reportRoutes = require('./routes/reportRoutes');
const hotspotRoutes = require('./routes/hotspotRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const authRoutes = require('./routes/authRoutes');

const app = express();

app.use(cors({ origin: CLIENT_ORIGIN }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Ocean Hazard Platform API is running',
    timestamp: new Date().toISOString()
  });
});

app.use('/api/incidents', incidentRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/hotspots', hotspotRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/auth', authRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
