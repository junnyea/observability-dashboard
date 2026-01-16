const express = require('express');
const router = express.Router();
const fs = require('fs');
const readline = require('readline');
const config = require('../config/services');

// Get recent logs from all services
router.get('/recent', async (req, res) => {
  const lines = parseInt(req.query.lines) || 100;
  const service = req.query.service; // optional filter

  try {
    const allLogs = [];

    for (const svc of config.services) {
      if (service && svc.name !== service) continue;

      // Get log file from dev environment config
      const logFile = svc.dev?.logFile;
      if (!logFile) continue;

      try {
        const content = fs.readFileSync(logFile, 'utf8');
        const logLines = content.split('\n').filter(line => line.trim());
        const recentLines = logLines.slice(-lines);

        recentLines.forEach(line => {
          allLogs.push({
            service: svc.name,
            displayName: svc.displayName,
            timestamp: new Date().toISOString(),
            raw: line,
            parsed: parseLogLine(line)
          });
        });
      } catch (err) {
        console.error(`Error reading ${logFile}:`, err.message);
      }
    }

    // Sort by timestamp if available, otherwise just return
    res.json(allLogs.slice(-lines));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

function parseLogLine(line) {
  const lowerLine = line.toLowerCase();
  let level = 'info';
  if (lowerLine.includes('error') || lowerLine.includes('err:')) {
    level = 'error';
  } else if (lowerLine.includes('warn')) {
    level = 'warn';
  } else if (lowerLine.includes('debug')) {
    level = 'debug';
  }
  return { level, message: line };
}

module.exports = router;
