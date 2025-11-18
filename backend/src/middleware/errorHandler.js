// Custom error class
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Handle CastError (Invalid MongoDB ObjectId)
const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

// Handle Duplicate field error
const handleDuplicateFieldsDB = (err) => {
  const field = Object.keys(err.keyValue)[0];
  const value = err.keyValue[field];
  const message = `${field} '${value}' already exists. Please use another value.`;
  return new AppError(message, 400);
};

// Handle Validation error
const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map(el => el.message);
  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 400);
};

// Handle JWT error
const handleJWTError = () =>
  new AppError('Invalid token. Please log in again!', 401);

// Handle JWT expired error
const handleJWTExpiredError = () =>
  new AppError('Your token has expired! Please log in again.', 401);

// Send error response in development
const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    success: false,
    error: err,
    message: err.message,
    stack: err.stack
  });
};

// Send error response in production
const sendErrorProd = (err, res) => {
  // Operational, trusted error: send message to client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message
    });
  } else {
    // Programming or other unknown error: don't leak error details
    console.error('ERROR', err);
    
    res.status(500).json({
      success: false,
      message: 'Something went wrong!'
    });
  }
};

// Global error handling middleware
const globalErrorHandler = (err, req, res, next) => {
  void next;
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else {
    let error = { ...err };
    error.message = err.message;

    // Handle specific error types
    if (error.name === 'CastError') error = handleCastErrorDB(error);
    if (error.code === 11000) error = handleDuplicateFieldsDB(error);
    if (error.name === 'ValidationError') error = handleValidationErrorDB(error);
    if (error.name === 'JsonWebTokenError') error = handleJWTError();
    if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();

    sendErrorProd(error, res);
  }
};

// Async error handler wrapper
const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

// 404 handler for undefined routes
const notFound = (req, res, next) => {
  const err = new AppError(`Can't find ${req.originalUrl} on this server!`, 404);
  next(err);
};

// Handle unhandled promise rejections
const handleUnhandledRejection = () => {
  process.on('unhandledRejection', (err, promise) => {
    void promise;
    console.log('UNHANDLED REJECTION! Shutting down...');
    console.log(err.name, err.message);
    process.exit(1);
  });
};

// Handle uncaught exceptions
const handleUncaughtException = () => {
  process.on('uncaughtException', (err) => {
    console.log('UNCAUGHT EXCEPTION!  Shutting down...');
    console.log(err.name, err.message);
    process.exit(1);
  });
};

// Handle SIGTERM
const handleSIGTERM = (server) => {
  process.on('SIGTERM', () => {
    console.log(' SIGTERM RECEIVED. Shutting down gracefully');
    server.close(() => {
      console.log(' Process terminated!');
    });
  });
};

// Validation error formatter
const formatValidationErrors = (errors) => {
  return errors.map(error => ({
    field: error.path,
    message: error.msg,
    value: error.value
  }));
};

// Database connection error handler
const handleDBConnectionError = (err) => {
  console.error('Database connection error:', err.message);
  
  if (err.name === 'MongoNetworkError') {
    console.error('MongoDB network error. Please check your connection.');
  } else if (err.name === 'MongooseServerSelectionError') {
    console.error('MongoDB server selection error. Please check if MongoDB is running.');
  } else if (err.name === 'MongoParseError') {
    console.error('MongoDB connection string parse error. Please check your connection string.');
  }
  
  process.exit(1);
};

// Rate limit error handler
const handleRateLimitError = (req, res) => {
  res.status(429).json({
    success: false,
    message: 'Too many requests from this IP, please try again later.',
    retryAfter: req.rateLimit?.resetTime || '15 minutes'
  });
};

// File upload error handler
const handleFileUploadError = (err, req, res, next) => {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      message: 'File too large. Maximum file size is 5MB.'
    });
  }
  
  if (err.code === 'LIMIT_FILE_COUNT') {
    return res.status(400).json({
      success: false,
      message: 'Too many files. Maximum 10 files allowed.'
    });
  }
  
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({
      success: false,
      message: 'Unexpected field name for file upload.'
    });
  }
  
  next(err);
};

// CORS error handler
const handleCORSError = (err, req, res, next) => {
  if (err.message && err.message.includes('CORS')) {
    return res.status(403).json({
      success: false,
      message: 'CORS policy violation. Origin not allowed.'
    });
  }
  next(err);
};

// Security error handler
const handleSecurityError = (err, req, res, next) => {
  if (err.type === 'entity.too.large') {
    return res.status(413).json({
      success: false,
      message: 'Request entity too large.'
    });
  }
  
  if (err.type === 'charset.unsupported') {
    return res.status(415).json({
      success: false,
      message: 'Unsupported charset.'
    });
  }
  
  next(err);
};

// Log error details
const logError = (err, req) => {
  const errorInfo = {
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    error: {
      name: err.name,
      message: err.message,
      stack: err.stack
    }
  };
  
  console.error('Error Details:', JSON.stringify(errorInfo, null, 2));
};

module.exports = {
  AppError,
  globalErrorHandler,
  catchAsync,
  notFound,
  handleUnhandledRejection,
  handleUncaughtException,
  handleSIGTERM,
  formatValidationErrors,
  handleDBConnectionError,
  handleRateLimitError,
  handleFileUploadError,
  handleCORSError,
  handleSecurityError,
  logError
};