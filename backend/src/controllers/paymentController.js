const { Payment, Site } = require('../models');
const billingService = require('../services/billingService');
const emailService = require('../services/emailService');
const { sendSuccess, sendError, asyncHandler } = require('../utils/responseUtils');
const { getFileUrl } = require('../services/paymentProofService');

/**
 * @desc    Get all payments
 * @route   GET /api/payments
 * @access  Private
 */
const getAllPayments = asyncHandler(async (req, res) => {
  let query = {};
  
  // Customer admins can only see their payments
  if (req.admin.role === 'customer_admin') {
    query.customer_id = req.admin.customer_id;
  }
  
  // Filter by status if provided
  if (req.query.status) {
    query.status = req.query.status;
  }
  
  const payments = await Payment.find(query)
    .populate('site_id', 'domain name')
    .populate('customer_id', 'name email')
    .sort({ createdAt: -1 });
  
  sendSuccess(res, 200, 'Payments retrieved successfully', { payments });
});

/**
 * @desc    Get single payment
 * @route   GET /api/payments/:id
 * @access  Private
 */
const getPayment = asyncHandler(async (req, res) => {
  const payment = await Payment.findById(req.params.id)
    .populate('site_id', 'domain name paymentAmount')
    .populate('customer_id', 'name email phone company')
    .populate('verifiedBy', 'name email');
  
  if (!payment) {
    return sendError(res, 404, 'Payment not found');
  }
  
  sendSuccess(res, 200, 'Payment retrieved successfully', { payment });
});

/**
 * @desc    Get payments for a specific site
 * @route   GET /api/sites/:siteId/payments
 * @access  Private
 */
const getSitePayments = asyncHandler(async (req, res) => {
  const payments = await Payment.find({ site_id: req.params.siteId })
    .populate('customer_id', 'name email')
    .populate('verifiedBy', 'name')
    .sort({ createdAt: -1 });
  
  sendSuccess(res, 200, 'Payments retrieved successfully', { payments });
});

/**
 * @desc    Upload payment proof
 * @route   POST /api/payments/:id/upload-proof
 * @access  Private (Customer Admin)
 */
const uploadPaymentProof = asyncHandler(async (req, res) => {
  const payment = await Payment.findById(req.params.id)
    .populate('site_id', 'domain')
    .populate('customer_id', 'name email');
  
  if (!payment) {
    return sendError(res, 404, 'Payment not found');
  }
  
  if (!req.file) {
    return sendError(res, 400, 'Please upload a file');
  }
  
  // Update payment with proof URL
  payment.proofUrl = getFileUrl(req.file.filename);
  payment.proofUploadedAt = new Date();
  payment.proofUploadedBy = req.admin._id;
  payment.status = 'proof_uploaded';
  
  await payment.save();
  
  // Notify super admin
  const { Admin } = require('../models');
  const superAdmins = await Admin.find({ role: 'super_admin', isActive: true });
  
  for (const admin of superAdmins) {
    await emailService.sendPaymentProofNotification(
      admin.email,
      payment.customer_id,
      payment.site_id,
      payment
    );
  }
  
  sendSuccess(res, 200, 'Payment proof uploaded successfully', { payment });
});

/**
 * @desc    Verify payment and mark as paid
 * @route   POST /api/payments/:id/verify
 * @access  Private (Super Admin)
 */
const verifyPayment = asyncHandler(async (req, res) => {
  const { notes } = req.body;
  
  const payment = await billingService.markPaymentAsPaid(
    req.params.id,
    req.admin._id,
    notes
  );
  
  // Reload the site to get the latest status
  const { Site } = require('../models');
  const updatedSite = await Site.findById(payment.site_id);
  
  await payment.populate('site_id customer_id');
  
  // Include site activation status in response
  const wasReactivated = updatedSite.status === 'active';
  
  sendSuccess(res, 200, wasReactivated ? 'Payment verified and site reactivated' : 'Payment verified successfully', { 
    payment,
    siteReactivated: wasReactivated,
    siteStatus: updatedSite.status
  });
});

/**
 * @desc    Manually mark payment as paid (without proof)
 * @route   POST /api/payments/:id/mark-paid
 * @access  Private (Super Admin)
 */
const markPaymentPaid = asyncHandler(async (req, res) => {
  const { notes } = req.body;
  
  const payment = await billingService.markPaymentAsPaid(
    req.params.id,
    req.admin._id,
    notes || 'Manually marked as paid by admin'
  );
  
  await payment.populate('site_id customer_id');
  
  sendSuccess(res, 200, 'Payment marked as paid successfully', { payment });
});

/**
 * @desc    Get pending payment for a site (customer view)
 * @route   GET /api/sites/:siteId/pending-payment
 * @access  Private (Customer Admin)
 */
const getPendingPayment = asyncHandler(async (req, res) => {
  const payment = await Payment.findOne({
    site_id: req.params.siteId,
    status: { $in: ['pending', 'overdue', 'proof_uploaded'] }
  })
  .populate('site_id', 'domain name paymentAmount')
  .sort({ dueDate: 1 }); // Get the earliest pending payment
  
  if (!payment) {
    return sendSuccess(res, 200, 'No pending payments', { payment: null });
  }
  
  sendSuccess(res, 200, 'Pending payment retrieved successfully', { payment });
});

/**
 * @desc    Download bill/invoice PDF
 * @route   GET /api/payments/:id/download-bill
 * @access  Private
 */
const downloadBill = asyncHandler(async (req, res) => {
  const path = require('path');
  
  const payment = await Payment.findById(req.params.id).populate('customer_id site_id');
  
  if (!payment) {
    return sendError(res, 404, 'Payment not found');
  }
  
  // Check if payment is paid and has a bill
  if (payment.status !== 'paid' || !payment.billUrl) {
    return sendError(res, 400, 'Bill not available for this payment');
  }
  
  // Check authorization (customer admins can only download their bills)
  if (req.admin.role === 'customer_admin' && 
      payment.customer_id._id.toString() !== req.admin.customer_id.toString()) {
    return sendError(res, 403, 'Not authorized to download this bill');
  }
  
  // Extract filename from billUrl
  const filename = payment.billUrl.split('/').pop();
  const filepath = path.join(__dirname, '../../public/bills', filename);
  
  // Check if file exists
  const fs = require('fs');
  if (!fs.existsSync(filepath)) {
    return sendError(res, 404, 'Bill file not found');
  }
  
  // Set headers for download
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  
  // Send file
  res.sendFile(filepath);
});

/**
 * @desc    Create payment invoice
 * @route   POST /api/payments
 * @access  Private (Super Admin)
 */
const createPayment = asyncHandler(async (req, res) => {
  const payment = await Payment.create(req.body);
  await payment.populate('site_id customer_id');
  
  sendSuccess(res, 201, 'Payment invoice created successfully', { payment });
});

module.exports = {
  getAllPayments,
  getPayment,
  getSitePayments,
  uploadPaymentProof,
  verifyPayment,
  markPaymentPaid,
  getPendingPayment,
  createPayment,
  downloadBill
};
