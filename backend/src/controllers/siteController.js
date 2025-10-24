const { Site, UptimeLog } = require('../models');
const billingService = require('../services/billingService');
const { sendSuccess, sendError, asyncHandler } = require('../utils/responseUtils');

/**
 * @desc    Get all sites
 * @route   GET /api/sites
 * @access  Private
 */
const getAllSites = asyncHandler(async (req, res) => {
  let query = {};
  
  // Customer admins can only see their sites
  if (req.admin.role === 'customer_admin') {
    query.customer_id = req.admin.customer_id;
  }
  
  const sites = await Site.find(query)
    .populate('customer_id', 'name email phone')
    .sort({ createdAt: -1 });
  
  sendSuccess(res, 200, 'Sites retrieved successfully', { sites });
});

/**
 * @desc    Get single site
 * @route   GET /api/sites/:id
 * @access  Private
 */
const getSite = asyncHandler(async (req, res) => {
  const site = await Site.findById(req.params.id)
    .populate('customer_id', 'name email phone company');
  
  if (!site) {
    return sendError(res, 404, 'Site not found');
  }
  
  // Return site directly, not wrapped in { site: ... }
  sendSuccess(res, 200, 'Site retrieved successfully', site);
});

/**
 * @desc    Create new site
 * @route   POST /api/sites
 * @access  Private (Super Admin)
 */
const createSite = asyncHandler(async (req, res) => {
  const realtimeUptimeService = require('../services/realtimeUptimeService');
  
  const site = await Site.create(req.body);
  
  // Create first payment invoice
  await billingService.createNextPayment(site._id);
  
  // Start real-time monitoring for this new site
  if (site.status === 'active') {
    realtimeUptimeService.startMonitoringSite(site._id.toString());
    console.log(`Started monitoring for new site: ${site.domain}`);
  }
  
  await site.populate('customer_id', 'name email phone');
  
  sendSuccess(res, 201, 'Site created successfully', { site });
});

/**
 * @desc    Update site
 * @route   PUT /api/sites/:id
 * @access  Private (Super Admin)
 */
const updateSite = asyncHandler(async (req, res) => {
  // Protect API key from accidental updates
  // API key can only be changed via regenerateApiKey endpoint
  const updateData = { ...req.body };
  delete updateData.apiKey; // Remove apiKey from update data
  delete updateData.apiKeyCreatedAt; // Remove apiKeyCreatedAt from update data
  
  const site = await Site.findByIdAndUpdate(
    req.params.id,
    updateData,
    { new: true, runValidators: true }
  ).populate('customer_id', 'name email phone');
  
  if (!site) {
    return sendError(res, 404, 'Site not found');
  }
  
  sendSuccess(res, 200, 'Site updated successfully', { site });
});

/**
 * @desc    Delete site
 * @route   DELETE /api/sites/:id
 * @access  Private (Super Admin)
 */
const deleteSite = asyncHandler(async (req, res) => {
  const { Payment, UptimeLog } = require('../models');
  const realtimeUptimeService = require('../services/realtimeUptimeService');
  
  const site = await Site.findById(req.params.id);
  
  if (!site) {
    return sendError(res, 404, 'Site not found');
  }
  
  // Stop real-time monitoring for this site
  realtimeUptimeService.stopMonitoringSite(site._id.toString());
  console.log(`Stopped monitoring for deleted site: ${site.domain}`);
  
  // Delete related data
  await UptimeLog.deleteMany({ site_id: site._id });
  await Payment.deleteMany({ site_id: site._id });
  
  // Delete site
  await site.deleteOne();
  
  sendSuccess(res, 200, 'Site and all related data deleted successfully');
});

/**
 * @desc    Suspend site
 * @route   POST /api/sites/:id/suspend
 * @access  Private (Super Admin)
 */
const suspendSite = asyncHandler(async (req, res) => {
  const realtimeUptimeService = require('../services/realtimeUptimeService');
  const { reason } = req.body;
  
  const site = await billingService.suspendSite(
    req.params.id,
    reason || 'manual',
    req.admin._id
  );
  
  // Stop monitoring suspended sites (optional - you can keep monitoring if needed)
  // realtimeUptimeService.stopMonitoringSite(site._id.toString());
  // console.log(`Stopped monitoring for suspended site: ${site.domain}`);
  
  sendSuccess(res, 200, 'Site suspended successfully', { site });
});

/**
 * @desc    Reactivate site
 * @route   POST /api/sites/:id/reactivate
 * @access  Private (Super Admin)
 */
const reactivateSite = asyncHandler(async (req, res) => {
  const realtimeUptimeService = require('../services/realtimeUptimeService');
  
  const site = await billingService.reactivateSite(req.params.id);
  
  // Start real-time monitoring for reactivated site
  realtimeUptimeService.startMonitoringSite(site._id.toString());
  console.log(`Started monitoring for reactivated site: ${site.domain}`);
  
  sendSuccess(res, 200, 'Site reactivated successfully', { site });
});

/**
 * @desc    Get site uptime statistics
 * @route   GET /api/sites/:id/uptime
 * @access  Private
 */
const getSiteUptime = asyncHandler(async (req, res) => {
  const uptimeService = require('../services/uptimeService');
  const hours = parseInt(req.query.hours) || 24;
  
  const stats = await uptimeService.getSiteUptimeStats(req.params.id, hours);
  
  sendSuccess(res, 200, 'Uptime statistics retrieved successfully', stats);
});

/**
 * @desc    Create reactivation payment for suspended site
 * @route   POST /api/sites/:id/create-reactivation-payment
 * @access  Private (Customer Admin)
 */
const createReactivationPayment = asyncHandler(async (req, res) => {
  const { Payment } = require('../models');
  const site = await Site.findById(req.params.id).populate('customer_id');
  
  if (!site) {
    return sendError(res, 404, 'Site not found');
  }
  
  // Check if site is suspended
  if (site.status !== 'suspended') {
    return sendError(res, 400, 'Site is not suspended');
  }
  
  // Check if there's already a pending payment for this site
  const existingPayment = await Payment.findOne({
    site_id: site._id,
    status: { $in: ['pending', 'proof_uploaded', 'overdue'] }
  });
  
  if (existingPayment) {
    return sendSuccess(res, 200, 'Payment already exists for this site', { payment: existingPayment });
  }
  
  // Create reactivation payment
  const periodStart = new Date();
  const periodEnd = new Date(periodStart);
  periodEnd.setMonth(periodEnd.getMonth() + site.paymentCycleMonths);
  
  const payment = new Payment({
    site_id: site._id,
    customer_id: site.customer_id._id,
    amount: site.paymentAmount,
    dueDate: new Date(), // Due immediately for reactivation
    periodStart,
    periodEnd,
    status: 'pending',
    notes: 'Reactivation payment for suspended site'
  });
  
  await payment.save();
  
  sendSuccess(res, 201, 'Reactivation payment created successfully', { payment });
});

/**
 * @desc    Get uptime logs for a site
 * @route   GET /api/sites/:id/uptime
 * @access  Private
 */
const getSiteUptimeLogs = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { hours = 24 } = req.query;
  
  // Verify site exists
  const site = await Site.findById(id);
  if (!site) {
    return sendError(res, 404, 'Site not found');
  }
  
  // Customer admins can only see their own sites
  if (req.admin.role === 'customer_admin' && site.customer_id.toString() !== req.admin.customer_id.toString()) {
    return sendError(res, 403, 'Access denied');
  }
  
  // Calculate time range
  const timeAgo = new Date();
  timeAgo.setHours(timeAgo.getHours() - parseInt(hours));
  
  // Fetch uptime logs
  const uptimeLogs = await UptimeLog.find({
    site_id: id,
    checkedAt: { $gte: timeAgo }
  })
  .sort({ checkedAt: -1 })
  .limit(1000);
  
  sendSuccess(res, 200, 'Uptime logs retrieved successfully', { uptimeLogs });
});

/**
 * @desc    Trigger immediate uptime check for a site
 * @route   POST /api/sites/:id/check-now
 * @access  Private
 */
const triggerUptimeCheck = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  // Verify site exists
  const site = await Site.findById(id);
  if (!site) {
    return sendError(res, 404, 'Site not found');
  }
  
  // Customer admins can only check their own sites
  if (req.admin.role === 'customer_admin' && site.customer_id.toString() !== req.admin.customer_id.toString()) {
    return sendError(res, 403, 'Access denied');
  }
  
  // Trigger immediate check
  const realtimeUptimeService = require('../services/realtimeUptimeService');
  const result = await realtimeUptimeService.performSiteCheck(id);
  
  if (!result) {
    return sendError(res, 500, 'Failed to perform uptime check');
  }
  
  sendSuccess(res, 200, 'Uptime check completed', { result });
});

/**
 * @desc    Enable maintenance mode for a site
 * @route   POST /api/sites/:id/maintenance/enable
 * @access  Private (Super Admin)
 */
const enableMaintenanceMode = asyncHandler(async (req, res) => {
  const { message } = req.body;
  
  const site = await Site.findById(req.params.id);
  
  if (!site) {
    return sendError(res, 404, 'Site not found');
  }
  
  site.maintenanceMode = true;
  if (message) {
    site.maintenanceMessage = message;
  }
  site.maintenanceEnabledAt = new Date();
  site.maintenanceEnabledBy = req.admin._id;
  
  await site.save();
  
  sendSuccess(res, 200, 'Maintenance mode enabled', { site });
});

/**
 * @desc    Disable maintenance mode for a site
 * @route   POST /api/sites/:id/maintenance/disable
 * @access  Private (Super Admin)
 */
const disableMaintenanceMode = asyncHandler(async (req, res) => {
  const site = await Site.findById(req.params.id);
  
  if (!site) {
    return sendError(res, 404, 'Site not found');
  }
  
  site.maintenanceMode = false;
  site.maintenanceEnabledAt = null;
  site.maintenanceEnabledBy = null;
  
  await site.save();
  
  sendSuccess(res, 200, 'Maintenance mode disabled', { site });
});

module.exports = {
  getAllSites,
  getSite,
  createSite,
  updateSite,
  deleteSite,
  suspendSite,
  reactivateSite,
  getSiteUptime,
  createReactivationPayment,
  getSiteUptimeLogs,
  triggerUptimeCheck,
  enableMaintenanceMode,
  disableMaintenanceMode
};
