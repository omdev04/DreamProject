const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { authenticate, authorizeSuperAdmin } = require('../middleware/authMiddleware');

// All routes require authentication
router.use(authenticate);

// Get dashboard statistics
router.get('/stats', dashboardController.getDashboardStats);

// Get recent activities
router.get('/activities', dashboardController.getRecentActivities);

// Get upcoming payments
router.get('/upcoming-payments', dashboardController.getUpcomingPayments);

// Super admin only - get low uptime sites
router.get('/low-uptime-sites', authorizeSuperAdmin, dashboardController.getLowUptimeSites);

module.exports = router;
