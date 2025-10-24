const { Site, Payment } = require('../models');
const billingService = require('../services/billingService');
const uptimeService = require('../services/uptimeService');
const { sendSuccess, asyncHandler } = require('../utils/responseUtils');

/**
 * @desc    Get dashboard statistics
 * @route   GET /api/dashboard/stats
 * @access  Private
 */
const getDashboardStats = asyncHandler(async (req, res) => {
  let query = {};
  
  // Customer admins only see their data
  if (req.admin.role === 'customer_admin') {
    query.customer_id = req.admin.customer_id;
  }
  
  // Get site statistics
  const [
    totalSites,
    activeSites,
    suspendedSites,
    downSites,
    billingStats
  ] = await Promise.all([
    Site.countDocuments(query),
    Site.countDocuments({ ...query, status: 'active' }),
    Site.countDocuments({ ...query, status: 'suspended' }),
    Site.countDocuments({ ...query, status: 'active', isCurrentlyDown: true }),
    req.admin.role === 'super_admin' ? billingService.getBillingStats() : null
  ]);
  
  const stats = {
    sites: {
      total: totalSites,
      active: activeSites,
      suspended: suspendedSites,
      down: downSites
    }
  };
  
  if (billingStats) {
    stats.billing = billingStats;
  }
  
  sendSuccess(res, 200, 'Dashboard statistics retrieved successfully', stats);
});

/**
 * @desc    Get recent activities
 * @route   GET /api/dashboard/activities
 * @access  Private
 */
const getRecentActivities = asyncHandler(async (req, res) => {
  let query = {};
  
  if (req.admin.role === 'customer_admin') {
    query.customer_id = req.admin.customer_id;
  }
  
  const limit = parseInt(req.query.limit) || 10;
  
  // Get recent payments
  const recentPayments = await Payment.find(query)
    .populate('site_id', 'domain')
    .populate('customer_id', 'name')
    .sort({ updatedAt: -1 })
    .limit(limit);
  
  sendSuccess(res, 200, 'Recent activities retrieved successfully', {
    payments: recentPayments
  });
});

/**
 * @desc    Get upcoming payments
 * @route   GET /api/dashboard/upcoming-payments
 * @access  Private
 */
const getUpcomingPayments = asyncHandler(async (req, res) => {
  let query = { status: 'pending' };
  
  if (req.admin.role === 'customer_admin') {
    query.customer_id = req.admin.customer_id;
  }
  
  const today = new Date();
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(today.getDate() + 30);
  
  query.dueDate = {
    $gte: today,
    $lte: thirtyDaysFromNow
  };
  
  const upcomingPayments = await Payment.find(query)
    .populate('site_id', 'domain name')
    .populate('customer_id', 'name email')
    .sort({ dueDate: 1 });
  
  sendSuccess(res, 200, 'Upcoming payments retrieved successfully', {
    payments: upcomingPayments
  });
});

/**
 * @desc    Get sites with low uptime
 * @route   GET /api/dashboard/low-uptime-sites
 * @access  Private (Super Admin)
 */
const getLowUptimeSites = asyncHandler(async (req, res) => {
  const threshold = parseFloat(req.query.threshold) || 95;
  
  const sites = await Site.find({
    status: 'active',
    currentUptime: { $lt: threshold }
  })
  .populate('customer_id', 'name email phone')
  .sort({ currentUptime: 1 })
  .limit(10);
  
  sendSuccess(res, 200, 'Low uptime sites retrieved successfully', { sites });
});

module.exports = {
  getDashboardStats,
  getRecentActivities,
  getUpcomingPayments,
  getLowUptimeSites
};
