const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();
const { csrfCheck } = require('./middleware/csrf');

// Validate essential environment variables at startup
if (!process.env.JWT_SECRET) {
  console.error('\n[Startup Error] Missing required env: JWT_SECRET');
  console.error('Add JWT_SECRET to backend/.env (see backend/.env.example)');
  process.exit(1);
}

// Import database connection
const connectDB = require('../config/database/connection');

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
// Skip rate limiting for E2E helper routes in local/E2E mode
app.use('/api/', (req, res, next) => {
  const isLocalOrE2E = process.env.E2E_MODE === 'true' || process.env.NODE_ENV !== 'production';
  const isE2ERoute = req.originalUrl.startsWith('/api/e2e');
  if (isLocalOrE2E && isE2ERoute) {
    return next();
  }
  return limiter(req, res, next);
});

// CORS configuration
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    process.env.FRONTEND_URL
  ].filter(Boolean),
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Optional CSRF protection (header-based placeholder)
// Enable by setting ENABLE_CSRF=true and include `x-csrf-token` header on unsafe methods
// In E2E mode, skip CSRF checks for `/api/e2e/*` routes to allow test helpers
app.use((req, res, next) => {
  if (process.env.E2E_MODE === 'true' && req.path.startsWith('/api/e2e')) {
    return next();
  }
  return csrfCheck(req, res, next);
});

// Logging middleware
app.use(morgan('combined'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'BBD School Backend API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API routes
  app.use('/api/auth', require('./routes/auth'));
  app.use('/api/admin', require('./routes/admin'));
  app.use('/api/faculty', require('./routes/faculty'));
  app.use('/api/student', require('./routes/student'));
  app.use('/api/general', require('./routes/general'));
  // Newly mounted domain routers
  app.use('/api/subjects', require('./routes/subjects'));
  app.use('/api/courses', require('./routes/courses'));
  app.use('/api/calendar', require('./routes/calendar'));
  app.use('/api/transport', require('./routes/transport'));
  app.use('/api/payments', require('./routes/payments'));
// E2E test-only routes
// Mount unconditionally to ensure test helpers are always available in dev
console.log('🧪 E2E routes mounted at /api/e2e');
  app.use('/api/e2e', require('./routes/e2e'));

// Serve frontend production build (same-origin) to avoid CORS in production
const distPath = path.join(__dirname, '../../dist');
app.use(express.static(distPath));

// SPA fallback: send index.html for non-API routes
// SPA fallback without path pattern to avoid path-to-regexp issues
app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  res.sendFile(path.join(distPath, 'index.html'));
});

// 404 handler - must be last
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    path: req.originalUrl
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 BBD School Backend Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;