const express = require('express');
const router = express.Router();
const {
  getEnvironment,
  setEnvironment,
  getAllEnvironments,
  getConfig
} = require('../config/environments');
const { testConnection, getAllConnectionStatus } = require('../db/pool');
const config = require('../config/services');

module.exports = (healthMonitor) => {
  // Get current environment and available environments
  router.get('/', (req, res) => {
    res.json({
      current: getEnvironment(),
      available: getAllEnvironments(),
      config: getConfig()
    });
  });

  // Switch environment
  router.post('/switch', (req, res) => {
    const { environment } = req.body;

    if (!environment) {
      return res.status(400).json({ error: 'Environment is required' });
    }

    try {
      const newEnv = setEnvironment(environment);

      // Update health monitor with new services
      const newServices = config.getServicesForEnv(newEnv);
      healthMonitor.updateServices(newServices);

      // Clear history and restart monitoring
      healthMonitor.restart();

      res.json({
        success: true,
        environment: newEnv,
        config: getConfig(newEnv),
        message: `Switched to ${newEnv} environment`
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  // Get database connection status for current environment
  router.get('/database', async (req, res) => {
    try {
      const status = await testConnection();
      res.json(status);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get database connection status for all environments
  router.get('/database/all', async (req, res) => {
    try {
      const status = await getAllConnectionStatus();
      res.json(status);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Test database connection for specific environment
  router.get('/database/:env', async (req, res) => {
    try {
      const status = await testConnection(req.params.env);
      res.json(status);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  return router;
};
