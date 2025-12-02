import { logger } from '../utils/logger.js';

export const errorHandler = (err, req, res, next) => {
  // Log the error
  logger.error('Error occurred:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  // Default error response
  let error = {
    success: false,
    error: 'Internal Server Error',
    message: 'Something went wrong on our end.',
    timestamp: new Date().toISOString()
  };

  // Handle specific error types
  if (err.name === 'ValidationError') {
    error.error = 'Validation Error';
    error.message = err.message;
    error.statusCode = 400;
  } else if (err.name === 'CastError') {
    error.error = 'Invalid ID';
    error.message = 'Resource not found';
    error.statusCode = 404;
  } else if (err.code === 11000) {
    // MongoDB duplicate key error
    error.error = 'Duplicate Field';
    error.message = 'Resource already exists';
    error.statusCode = 400;
  } else if (err.name === 'JsonWebTokenError') {
    error.error = 'Invalid Token';
    error.message = 'Please provide a valid token';
    error.statusCode = 401;
  } else if (err.name === 'TokenExpiredError') {
    error.error = 'Token Expired';
    error.message = 'Please login again';
    error.statusCode = 401;
  } else if (err.code === 'ECONNREFUSED') {
    error.error = 'Service Unavailable';
    error.message = 'External service is temporarily unavailable';
    error.statusCode = 503;
  } else if (err.code === 'ENOTFOUND') {
    error.error = 'Network Error';
    error.message = 'Unable to connect to external service';
    error.statusCode = 503;
  } else if (err.code === 'ETIMEDOUT') {
    error.error = 'Timeout';
    error.message = 'Request timed out. Please try again.';
    error.statusCode = 408;
  }

  // Set status code
  const statusCode = error.statusCode || err.statusCode || 500;

  // Don't leak error details in production
  if (process.env.NODE_ENV === 'production') {
    delete error.stack;
    
    // Only show generic messages for 500 errors in production
    if (statusCode === 500) {
      error.message = 'Internal Server Error';
    }
  } else {
    // Include stack trace in development
    error.stack = err.stack;
    error.details = {
      name: err.name,
      code: err.code,
      originalMessage: err.message
    };
  }

  // Add request information for debugging
  error.requestId = req.id || 'unknown';
  error.path = req.path;
  error.method = req.method;

  res.status(statusCode).json(error);
};

// 404 handler
export const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

// Async error handler wrapper
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};