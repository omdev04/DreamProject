const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const siteController = require('../controllers/siteController');
const paymentController = require('../controllers/paymentController');
const { authenticate, authorizeSuperAdmin, authorizeSiteAccess } = require('../middleware/authMiddleware');
const { handleValidationErrors } = require('../middleware/validationMiddleware');

// Validation rules
const siteValidation = [
  body('customer_id').notEmpty().withMessage('Customer ID is required'),
  body('domain').trim().notEmpty().withMessage('Domain is required'),
  body('name').trim().notEmpty().withMessage('Site name is required'),
  body('paymentAmount').isNumeric().withMessage('Payment amount must be a number'),
  body('nextPaymentDate').isISO8601().withMessage('Next payment date must be a valid date'),
  handleValidationErrors
];

// All routes require authentication
router.use(authenticate);

// List all sites (filtered by role)
router.get('/', siteController.getAllSites);

// Get single site
router.get('/:id', authorizeSiteAccess, siteController.getSite);

// Get uptime logs for site
router.get('/:id/uptime', authorizeSiteAccess, siteController.getSiteUptimeLogs);

// Trigger immediate uptime check
router.post('/:id/check-now', authorizeSiteAccess, siteController.triggerUptimeCheck);

// Get uptime stats for site (deprecated, kept for compatibility)
router.get('/:id/uptime-stats', authorizeSiteAccess, siteController.getSiteUptime);

// Get payments for site
router.get('/:siteId/payments', authorizeSiteAccess, paymentController.getSitePayments);

// Get pending payment for site (customer view)
router.get('/:siteId/pending-payment', authorizeSiteAccess, paymentController.getPendingPayment);

// Customer can create reactivation payment for their suspended sites
router.post('/:id/create-reactivation-payment', authorizeSiteAccess, siteController.createReactivationPayment);

// Super admin only routes
router.post('/', authorizeSuperAdmin, siteValidation, siteController.createSite);
router.put('/:id', authorizeSuperAdmin, siteController.updateSite);
router.delete('/:id', authorizeSuperAdmin, siteController.deleteSite);
router.post('/:id/suspend', authorizeSuperAdmin, siteController.suspendSite);
router.post('/:id/reactivate', authorizeSuperAdmin, siteController.reactivateSite);
router.post('/:id/maintenance/enable', authorizeSuperAdmin, siteController.enableMaintenanceMode);
router.post('/:id/maintenance/disable', authorizeSuperAdmin, siteController.disableMaintenanceMode);

module.exports = router;
