const { getAuthToken } = require('../routes/auth');

function setupLogSocket(io, logTailer) {
  const logNamespace = io.of('/logs');

  // Auth middleware for WebSocket (async to fetch token from DB)
  logNamespace.use(async (socket, next) => {
    const token = socket.handshake.auth?.token;
    const authToken = await getAuthToken();

    if (token && token === authToken) {
      next();
    } else {
      next(new Error('Unauthorized'));
    }
  });

  logNamespace.on('connection', (socket) => {
    console.log(`[WebSocket] Client connected to log stream: ${socket.id}`);

    // Track which services this client wants to see
    socket.activeServices = new Set(['config-svc', 'tenant-svc', 'checkin-svc', 'admin-svc']);
    socket.filters = { search: '', level: 'all' };

    // Client subscribes to specific services
    socket.on('subscribe', (services) => {
      if (Array.isArray(services)) {
        socket.activeServices = new Set(services);
        console.log(`[WebSocket] ${socket.id} subscribed to: ${services.join(', ')}`);
      }
    });

    // Client sets filter criteria
    socket.on('filter', (filters) => {
      socket.filters = { ...socket.filters, ...filters };
    });

    socket.on('disconnect', () => {
      console.log(`[WebSocket] Client disconnected: ${socket.id}`);
    });
  });

  // Forward log events to connected clients
  logTailer.on('log', (logEntry) => {
    const sockets = logNamespace.sockets;

    sockets.forEach((socket) => {
      // Check if client is subscribed to this service
      if (!socket.activeServices.has(logEntry.service)) {
        return;
      }

      // Apply search filter
      const { search, level } = socket.filters;
      if (search && !logEntry.raw.toLowerCase().includes(search.toLowerCase())) {
        return;
      }

      // Apply level filter
      if (level && level !== 'all' && logEntry.parsed.level !== level) {
        return;
      }

      socket.emit('log', logEntry);
    });
  });

  logTailer.on('error', (errorInfo) => {
    logNamespace.emit('tailer-error', errorInfo);
  });

  return logNamespace;
}

function setupHealthSocket(io, healthMonitor) {
  const healthNamespace = io.of('/health');

  // Auth middleware for WebSocket (async to fetch token from DB)
  healthNamespace.use(async (socket, next) => {
    const token = socket.handshake.auth?.token;
    const authToken = await getAuthToken();

    if (token && token === authToken) {
      next();
    } else {
      next(new Error('Unauthorized'));
    }
  });

  healthNamespace.on('connection', (socket) => {
    console.log(`[WebSocket] Client connected to health stream: ${socket.id}`);

    // Send current status immediately on connect
    socket.emit('status', healthMonitor.getAllStatus());

    socket.on('disconnect', () => {
      console.log(`[WebSocket] Client disconnected from health: ${socket.id}`);
    });
  });

  // Broadcast health updates to all connected clients
  healthMonitor.onUpdate = (status) => {
    healthNamespace.emit('status', healthMonitor.getAllStatus());
  };

  return healthNamespace;
}

module.exports = { setupLogSocket, setupHealthSocket };
