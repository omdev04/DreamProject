const express = require('express');
const router = express.Router();
const Site = require('../models/Site');
const Payment = require('../models/Payment');

/**
 * @route   GET /api/public/check-status/:apiKey
 * @desc    Check site status for widget (real-time monitoring) using API Key
 * @access  Public (API Key authentication)
 */
router.get('/check-status/:apiKey', async (req, res) => {
  try {
    const { apiKey } = req.params;

    // Validate API key format (64 hex characters)
    if (!apiKey || apiKey.length !== 64 || !/^[a-f0-9]{64}$/.test(apiKey)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid API key format'
      });
    }

    // Find site by API Key
    const site = await Site.findOne({ apiKey }).select('status suspensionReason domain currentUptime maintenanceMode maintenanceMessage _id');

    if (!site) {
      return res.status(404).json({
        success: false,
        message: 'Invalid API key or site not found'
      });
    }

    // Check for pending/overdue payments
    const pendingPayment = await Payment.findOne({
      site_id: site._id,
      status: { $in: ['pending', 'proof_uploaded', 'overdue'] }
    }).sort({ dueDate: 1 });

    const paymentDue = pendingPayment !== null;
    const paymentUrl = pendingPayment ? `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/${site._id}` : null;

    // Response data
    const responseData = {
      status: site.status, // 'active' or 'suspended'
      reason: site.suspensionReason || null,
      message: site.status === 'suspended' 
        ? 'This website has been temporarily suspended. Please complete payment to reactivate.' 
        : null,
      maintenanceMode: site.maintenanceMode || false,
      maintenanceMessage: site.maintenanceMessage || 'We are currently performing scheduled maintenance. Please check back soon.',
      paymentDue: paymentDue,
      dueAmount: pendingPayment?.amount || null,
      dueDate: pendingPayment?.dueDate || null,
      paymentUrl: paymentUrl,
      uptime: site.currentUptime || 100
    };

    res.json({
      success: true,
      data: responseData
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * @route   GET /api/public/sites/:siteId/status
 * @desc    Check site status (for website integration)
 * @access  Public (no authentication required)
 */
router.get('/sites/:siteId/status', async (req, res) => {
  try {
    const { siteId } = req.params;

    // Find site by ID or domain
    const site = await Site.findOne({
      $or: [
        { _id: siteId },
        { domain: siteId }
      ]
    }).select('status suspensionReason isActive domain');

    if (!site) {
      return res.status(404).json({
        success: false,
        message: 'Site not found'
      });
    }

    // Check for overdue payments
    const overduePayments = await Payment.find({
      site_id: site._id,
      status: { $in: ['pending', 'proof_uploaded', 'overdue'] },
      dueDate: { $lt: new Date() }
    }).sort({ dueDate: 1 });

    const hasOverduePayment = overduePayments.length > 0;
    let daysOverdue = 0;

    if (hasOverduePayment) {
      const oldestPayment = overduePayments[0];
      const diffTime = Math.abs(new Date() - new Date(oldestPayment.dueDate));
      daysOverdue = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    // Determine if site should be shown or suspended
    const isSuspended = site.status === 'suspended' || !site.isActive;

    res.json({
      success: true,
      data: {
        domain: site.domain,
        status: isSuspended ? 'suspended' : 'active',
        suspensionReason: site.suspensionReason,
        hasOverduePayment,
        daysOverdue,
        overduePaymentCount: overduePayments.length
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error checking site status'
    });
  }
});

/**
 * @route   GET /api/public/sites/domain/:domain/status
 * @desc    Check site status by domain name
 * @access  Public
 */
router.get('/sites/domain/:domain/status', async (req, res) => {
  try {
    const { domain } = req.params;

    const site = await Site.findOne({ domain })
      .select('status suspensionReason isActive domain');

    if (!site) {
      return res.status(404).json({
        success: false,
        message: 'Site not found'
      });
    }

    // Check for overdue payments
    const overduePayments = await Payment.find({
      site_id: site._id,
      status: { $in: ['pending', 'proof_uploaded', 'overdue'] },
      dueDate: { $lt: new Date() }
    }).sort({ dueDate: 1 });

    const hasOverduePayment = overduePayments.length > 0;
    let daysOverdue = 0;

    if (hasOverduePayment) {
      const oldestPayment = overduePayments[0];
      const diffTime = Math.abs(new Date() - new Date(oldestPayment.dueDate));
      daysOverdue = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    const isSuspended = site.status === 'suspended' || !site.isActive;

    res.json({
      success: true,
      data: {
        domain: site.domain,
        status: isSuspended ? 'suspended' : 'active',
        suspensionReason: site.suspensionReason,
        hasOverduePayment,
        daysOverdue,
        overduePaymentCount: overduePayments.length
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error checking site status'
    });
  }
});

module.exports = router;
