const express = require('express');
const router = express.Router();

// Hardcoded credentials
const ADMIN_USER = 'admin';
const ADMIN_PASS = 'admin2024@@';

// Simple token (in production, use JWT)
const AUTH_TOKEN = 'obv-dashboard-token-2024';

// Login endpoint
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (username === ADMIN_USER && password === ADMIN_PASS) {
    res.json({
      success: true,
      token: AUTH_TOKEN,
      user: { username: ADMIN_USER }
    });
  } else {
    res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }
});

// Verify token endpoint
router.get('/verify', (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (token === AUTH_TOKEN) {
    res.json({ valid: true, user: { username: ADMIN_USER } });
  } else {
    res.status(401).json({ valid: false });
  }
});

// Logout endpoint
router.post('/logout', (req, res) => {
  res.json({ success: true });
});

// Auth middleware for protecting routes
const authMiddleware = (req, res, next) => {
  // Skip auth for login and static files
  if (req.path === '/api/auth/login' || req.path === '/api/auth/verify') {
    return next();
  }

  const token = req.headers.authorization?.replace('Bearer ', '');

  if (token === AUTH_TOKEN) {
    req.user = { username: ADMIN_USER };
    next();
  } else {
    res.status(401).json({ error: 'Unauthorized' });
  }
};

module.exports = { router, authMiddleware, AUTH_TOKEN };
