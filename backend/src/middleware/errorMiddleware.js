const { sendError } = require('../utils/responseUtils');

/**
 * Global Error Handler Middleware
 * Catches all errors and sends standardized error response
 */
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => ({
      field: e.path,
      message: e.message
    }));
    return sendError(res, 400, 'Validation failed', errors);
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return sendError(res, 400, `${field} already exists`);
  }

  // Mongoose cast error (invalid ObjectId)
  if (err.name === 'CastError') {
    return sendError(res, 400, 'Invalid ID format');
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return sendError(res, 401, 'Invalid token');
  }

  if (err.name === 'TokenExpiredError') {
    return sendError(res, 401, 'Token expired');
  }

  // Multer errors (file upload)
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return sendError(res, 400, 'File size exceeds limit');
    }
    return sendError(res, 400, err.message);
  }

  // Default server error
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  
  sendError(res, statusCode, message);
};

/**
 * 404 Not Found Handler
 */
const notFoundHandler = (req, res) => {
  sendError(res, 404, 'Route not found');
};

module.exports = {
  errorHandler,
  notFoundHandler
};
