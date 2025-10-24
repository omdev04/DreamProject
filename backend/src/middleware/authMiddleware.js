const { Admin } = require('../models');
const { verifyToken, extractToken } = require('../utils/jwtUtils');
const { sendError } = require('../utils/responseUtils');

/**
 * Authentication Middleware
 * Verifies JWT token and attaches user to request
 */
const authenticate = async (req, res, next) => {
  try {
    const token = extractToken(req);
    
    if (!token) {
      return sendError(res, 401, 'No token provided, authorization denied');
    }

    const decoded = verifyToken(token);
    
    // Find admin by ID from token
    const admin = await Admin.findById(decoded.id).select('-password');
    
    if (!admin) {
      return sendError(res, 401, 'User not found');
    }

    if (!admin.isActive) {
      return sendError(res, 403, 'Account is disabled');
    }

    // Attach admin to request object
    req.admin = admin;
    next();
    
  } catch (error) {
    return sendError(res, 401, error.message || 'Invalid token');
  }
};

/**
 * Super Admin Authorization Middleware
 * Ensures user has super_admin role
 */
const authorizeSuperAdmin = (req, res, next) => {
  if (req.admin.role !== 'super_admin') {
    return sendError(res, 403, 'Access denied. Super admin role required');
  }
  next();
};

/**
 * Customer Admin Authorization Middleware
 * Ensures user can access specific customer data
 */
const authorizeCustomerAccess = async (req, res, next) => {
  try {
    // Super admins can access everything
    if (req.admin.role === 'super_admin') {
      return next();
    }

    // Customer admins can only access their own data
    const customerId = req.params.customerId || req.body.customer_id;
    
    if (!customerId) {
      return sendError(res, 400, 'Customer ID required');
    }

    if (req.admin.customer_id.toString() !== customerId.toString()) {
      return sendError(res, 403, 'Access denied. You can only access your own data');
    }

    next();
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

/**
 * Site Access Authorization Middleware
 * Ensures user can access specific site
 */
const authorizeSiteAccess = async (req, res, next) => {
  try {
    const { Site } = require('../models');
    
    // Super admins can access all sites
    if (req.admin.role === 'super_admin') {
      return next();
    }

    // Customer admins can only access their sites
    const siteId = req.params.siteId || req.params.id;
    
    if (!siteId) {
      return sendError(res, 400, 'Site ID required');
    }

    const site = await Site.findById(siteId);
    
    if (!site) {
      return sendError(res, 404, 'Site not found');
    }

    if (!req.admin.canAccessSite(site.customer_id)) {
      return sendError(res, 403, 'Access denied. You cannot access this site');
    }

    // Attach site to request for use in controller
    req.site = site;
    next();
    
  } catch (error) {
    return sendError(res, 500, error.message);
  }
};

module.exports = {
  authenticate,
  authorizeSuperAdmin,
  authorizeCustomerAccess,
  authorizeSiteAccess
};
