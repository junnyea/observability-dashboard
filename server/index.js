require('dotenv').config();

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');

const config = require('./config/services');
const LogTailer = require('./services/log-tailer');
const HealthMonitor = require('./services/health-monitor');
const { setupLogSocket, setupHealthSocket } = require('./sockets/log-stream');
const healthRoutes = require('./routes/health');
const metricsRoutes = require('./routes/metrics');
const logsRoutes = require('./routes/logs');
const { router: authRoutes, authMiddleware, AUTH_TOKEN } = require('./routes/auth');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Initialize services
const logTailer = new LogTailer(config.services);
const healthMonitor = new HealthMonitor(config.services, config.healthCheckInterval);

// Setup WebSocket namespaces
setupLogSocket(io, logTailer);
setupHealthSocket(io, healthMonitor);

// Health check (unprotected)
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'observability-dashboard', timestamp: new Date().toISOString() });
});

// Auth routes (unprotected)
app.use('/api/auth', authRoutes);

// Protected API routes
app.use('/api/health', authMiddleware, healthRoutes(healthMonitor));
app.use('/api/metrics', authMiddleware, metricsRoutes);
app.use('/api/logs', authMiddleware, logsRoutes);

// Dashboard info endpoint (protected)
app.get('/api/info', authMiddleware, (req, res) => {
  res.json({
    name: 'Bulwark Observability Dashboard',
    version: '1.0.0',
    services: config.services.map(s => ({ name: s.name, port: s.port })),
    uptime: process.uptime()
  });
});

// Serve static frontend in production
const clientDistPath = path.join(__dirname, '../client/dist');
app.use(express.static(clientDistPath));

// SPA fallback - serve index.html for all non-API routes
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(clientDistPath, 'index.html'));
  } else {
    res.status(404).json({ error: 'API endpoint not found' });
  }
});

// Start services
logTailer.start();
healthMonitor.start();

const PORT = config.dashboardPort;
server.listen(PORT, () => {
  console.log('========================================');
  console.log('  Bulwark Observability Dashboard');
  console.log('========================================');
  console.log(`  URL: http://localhost:${PORT}`);
  console.log(`  API: http://localhost:${PORT}/api`);
  console.log('');
  console.log('  Monitoring services:');
  config.services.forEach(s => {
    console.log(`    - ${s.name} (port ${s.port})`);
  });
  console.log('========================================');
});

// Graceful shutdown
const shutdown = () => {
  console.log('\nShutting down...');
  logTailer.stop();
  healthMonitor.stop();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
