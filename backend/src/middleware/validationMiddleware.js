const { validationResult } = require('express-validator');
const { sendError } = require('../utils/responseUtils');

/**
 * Validation Error Handler Middleware
 * Processes validation errors from express-validator
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(err => ({
      field: err.param,
      message: err.msg
    }));
    
    return sendError(res, 400, 'Validation failed', errorMessages);
  }
  
  next();
};

module.exports = { handleValidationErrors };
