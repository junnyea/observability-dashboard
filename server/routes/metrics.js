const express = require('express');
const router = express.Router();
const metricsService = require('../services/metrics-service');

// Get summary metrics (today, week counts)
router.get('/summary', async (req, res) => {
  try {
    const summary = await metricsService.getSummary();
    res.json(summary);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get request stats by time period
router.get('/requests', async (req, res) => {
  try {
    const from = req.query.from ? new Date(req.query.from) : new Date(Date.now() - 24 * 60 * 60 * 1000);
    const to = req.query.to ? new Date(req.query.to) : new Date();
    const stats = await metricsService.getRequestStats(from, to);
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get error stats by time period
router.get('/errors', async (req, res) => {
  try {
    const from = req.query.from ? new Date(req.query.from) : new Date(Date.now() - 24 * 60 * 60 * 1000);
    const to = req.query.to ? new Date(req.query.to) : new Date();
    const stats = await metricsService.getErrorStats(from, to);
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get top endpoints (last 24 hours)
router.get('/top-endpoints', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const endpoints = await metricsService.getTopEndpoints(limit);
    res.json(endpoints);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get hourly request/error chart data
router.get('/hourly', async (req, res) => {
  try {
    const hours = parseInt(req.query.hours) || 24;
    const [requests, errors] = await Promise.all([
      metricsService.getHourlyStats(hours),
      metricsService.getHourlyErrors(hours)
    ]);

    // Merge data by hour
    const merged = {};
    requests.forEach(r => {
      merged[r.hour] = { hour: r.hour, requests: parseInt(r.request_count), errors: 0 };
    });
    errors.forEach(e => {
      if (merged[e.hour]) {
        merged[e.hour].errors = parseInt(e.error_count);
      } else {
        merged[e.hour] = { hour: e.hour, requests: 0, errors: parseInt(e.error_count) };
      }
    });

    const data = Object.values(merged).sort((a, b) => new Date(a.hour) - new Date(b.hour));
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Test database connection
router.get('/db-status', async (req, res) => {
  const connected = await metricsService.testConnection();
  res.json({ connected });
});

module.exports = router;
