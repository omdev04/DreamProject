const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const customerController = require('../controllers/customerController');
const { authenticate, authorizeSuperAdmin } = require('../middleware/authMiddleware');
const { handleValidationErrors } = require('../middleware/validationMiddleware');

// Validation rules
const customerValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('phone').trim().notEmpty().withMessage('Phone is required'),
  handleValidationErrors
];

// All routes require authentication and super admin role
router.use(authenticate);
router.use(authorizeSuperAdmin);

router.get('/', customerController.getAllCustomers);
router.get('/:id', customerController.getCustomer);
router.post('/', customerValidation, customerController.createCustomer);
router.put('/:id', customerController.updateCustomer);
router.delete('/:id', customerController.deleteCustomer);

module.exports = router;
