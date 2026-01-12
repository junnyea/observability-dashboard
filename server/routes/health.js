const express = require('express');
const router = express.Router();

module.exports = (healthMonitor) => {
  // Get current health status of all services
  router.get('/', (req, res) => {
    res.json(healthMonitor.getAllStatus());
  });

  // Get health history for a specific service
  router.get('/history/:service', (req, res) => {
    const history = healthMonitor.history[req.params.service] || [];
    res.json({
      service: req.params.service,
      history: history.slice(-50) // Last 50 entries
    });
  });

  // Force a health check now
  router.post('/check', async (req, res) => {
    const results = await healthMonitor.checkAll();
    res.json(results);
  });

  return router;
};
