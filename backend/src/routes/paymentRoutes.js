const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { authenticate, authorizeSuperAdmin } = require('../middleware/authMiddleware');
const { uploadPaymentProof } = require('../services/paymentProofService');

// All routes require authentication
router.use(authenticate);

// Get all payments (filtered by role)
router.get('/', paymentController.getAllPayments);

// Get single payment
router.get('/:id', paymentController.getPayment);

// Download bill/invoice (for paid payments)
router.get('/:id/download-bill', paymentController.downloadBill);

// Upload payment proof (customer admin)
router.post('/:id/upload-proof', uploadPaymentProof, paymentController.uploadPaymentProof);

// Super admin only routes
router.post('/', authorizeSuperAdmin, paymentController.createPayment);
router.post('/:id/verify', authorizeSuperAdmin, paymentController.verifyPayment);
router.post('/:id/mark-paid', authorizeSuperAdmin, paymentController.markPaymentPaid);

module.exports = router;
