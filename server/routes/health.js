const express = require('express');
const router = express.Router();

module.exports = (healthMonitor) => {
  // Get current health status of all services
  router.get('/', (req, res) => {
    res.json(healthMonitor.getAllStatus());
  });

  // Get database health status
  router.get('/databases', (req, res) => {
    res.json(healthMonitor.getDatabaseStatus());
  });

  // Get health history for a specific service
  router.get('/history/:service', (req, res) => {
    const history = healthMonitor.history[req.params.service] || [];
    res.json({
      service: req.params.service,
      history: history.slice(-50) // Last 50 entries
    });
  });

  // Get database health history
  router.get('/databases/history/:env', (req, res) => {
    const env = req.params.env.toLowerCase();
    const history = healthMonitor.databaseHistory[env] || [];
    res.json({
      environment: env,
      history: history.slice(-50) // Last 50 entries
    });
  });

  // Force a health check now
  router.post('/check', async (req, res) => {
    const results = await healthMonitor.checkAll();
    res.json({
      services: results,
      databases: healthMonitor.databaseStatus
    });
  });

  // End-to-end health check - validates full stack (service + DB query)
  router.get('/e2e', async (req, res) => {
    const results = await healthMonitor.checkAllEndToEnd();
    res.json(results);
  });

  // End-to-end health check for specific environment
  router.get('/e2e/:env', async (req, res) => {
    const env = req.params.env.toLowerCase();
    if (!['dev', 'prod'].includes(env)) {
      return res.status(400).json({ error: 'Invalid environment. Use dev or prod.' });
    }
    const results = await healthMonitor.checkEndToEnd(env);
    res.json(results);
  });

  // Service-to-DB health check - calls each service's /health/db endpoint
  router.get('/service-db', async (req, res) => {
    const results = await healthMonitor.checkAllServiceDbHealth();
    res.json(results);
  });

  // Service-to-DB health check for specific environment
  router.get('/service-db/:env', async (req, res) => {
    const env = req.params.env.toLowerCase();
    if (!['dev', 'prod'].includes(env)) {
      return res.status(400).json({ error: 'Invalid environment. Use dev or prod.' });
    }
    const results = await healthMonitor.checkServiceDbHealth(env);
    res.json(results);
  });

  return router;
};
