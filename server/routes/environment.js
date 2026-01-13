const express = require('express');
const router = express.Router();
const { getEnvironments, getDatabase, services } = require('../config/environments');
const { testConnection, getAllConnectionStatus } = require('../db/pool');

module.exports = (healthMonitor) => {
  // Get available environments
  router.get('/', (req, res) => {
    res.json({
      environments: getEnvironments(),
      services: Object.keys(services)
    });
  });

  // Get database connection status for all environments
  router.get('/database', async (req, res) => {
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
