const express = require('express');
const router = express.Router();
const authService = require('../services/auth-service');

// Login endpoint
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({
      success: false,
      message: 'Username and password are required'
    });
  }

  const result = await authService.validateUser(username, password);

  if (result.valid) {
    const token = await authService.getAuthToken();
    res.json({
      success: true,
      token: token,
      user: result.user
    });
  } else {
    res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }
});

// Verify token endpoint
router.get('/verify', async (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ valid: false });
  }

  const isValid = await authService.verifyToken(token);

  if (isValid) {
    res.json({ valid: true });
  } else {
    res.status(401).json({ valid: false });
  }
});

// Logout endpoint
router.post('/logout', (req, res) => {
  res.json({ success: true });
});

// Auth middleware for protecting routes
const authMiddleware = async (req, res, next) => {
  // Skip auth for login and static files
  if (req.path === '/api/auth/login' || req.path === '/api/auth/verify') {
    return next();
  }

  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const isValid = await authService.verifyToken(token);

  if (isValid) {
    next();
  } else {
    res.status(401).json({ error: 'Unauthorized' });
  }
};

// Helper to get auth token (for WebSocket auth)
const getAuthToken = () => authService.getAuthToken();

module.exports = { router, authMiddleware, getAuthToken };
