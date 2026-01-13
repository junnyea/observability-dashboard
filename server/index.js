require('dotenv').config();

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');

const config = require('./config/services');
const { services, getServiceList, getDatabase, getEnvironments } = require('./config/environments');
const LogTailer = require('./services/log-tailer');
const HealthMonitor = require('./services/health-monitor');
const { setupLogSocket, setupHealthSocket } = require('./sockets/log-stream');
const healthRoutes = require('./routes/health');
const metricsRoutes = require('./routes/metrics');
const logsRoutes = require('./routes/logs');
const { router: authRoutes, authMiddleware } = require('./routes/auth');
const authService = require('./services/auth-service');

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

// Build log files list from services config
const logFiles = getServiceList()
  .filter(s => s.dev.logFile)
  .map(s => ({
    name: s.name,
    logFile: s.dev.logFile
  }));

// Initialize services
const logTailer = new LogTailer(logFiles);
const healthMonitor = new HealthMonitor(config.healthCheckInterval);

// Setup WebSocket namespaces
setupLogSocket(io, logTailer);
setupHealthSocket(io, healthMonitor);

// Health check (unprotected)
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'observability-dashboard',
    timestamp: new Date().toISOString()
  });
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
    version: '2.0.0',
    environments: getEnvironments(),
    services: Object.keys(services),
    uptime: process.uptime()
  });
});

// Services config endpoint (protected)
app.get('/api/services', authMiddleware, (req, res) => {
  res.json(services);
});

// Database status endpoint (protected)
app.get('/api/database', authMiddleware, async (req, res) => {
  const { Pool } = require('pg');
  const env = req.query.env || 'dev';
  const dbConfig = await getDatabase(env);

  if (!dbConfig || !dbConfig.host) {
    return res.json({
      connected: false,
      error: `Database not configured for environment: ${env}`
    });
  }

  try {
    const pool = new Pool(dbConfig);
    const result = await pool.query('SELECT NOW() as now, current_database() as database');
    await pool.end();

    res.json({
      environment: env,
      connected: true,
      database: result.rows[0].database,
      serverTime: result.rows[0].now
    });
  } catch (error) {
    res.json({
      environment: env,
      connected: false,
      error: error.message
    });
  }
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

// Initialize auth service (verify credentials from database)
const initializeAuth = async () => {
  const success = await authService.initialize();
  if (!success) {
    console.error('[Auth] WARNING: Auth service initialization failed');
  }
};

server.listen(PORT, async () => {
  // Initialize auth on startup
  await initializeAuth();

  console.log('');
  console.log('==========================================');
  console.log('   Bulwark Observability Dashboard v2.0');
  console.log('==========================================');
  console.log(`   URL: http://localhost:${PORT}`);
  console.log(`   API: http://localhost:${PORT}/api`);
  console.log('');
  console.log('   Monitoring Services:');
  Object.entries(services).forEach(([name, svc]) => {
    const devLocal = svc.dev.localPort ? `DEV:${svc.dev.localPort}` : '';
    const devAws = svc.dev.awsUrl ? 'DEV-AWS' : '';
    const prodAws = svc.prod.awsUrl ? 'PROD-AWS' : '';
    const endpoints = [devLocal, devAws, prodAws].filter(Boolean).join(', ');
    console.log(`     - ${name} (${endpoints})`);
  });
  console.log('');
  console.log('   View: DEV + PROD side by side');
  console.log('==========================================');
  console.log('');
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
