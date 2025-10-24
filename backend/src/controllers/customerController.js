const { Customer } = require('../models');
const { sendSuccess, sendError, asyncHandler } = require('../utils/responseUtils');

/**
 * @desc    Get all customers
 * @route   GET /api/customers
 * @access  Private (Super Admin)
 */
const getAllCustomers = asyncHandler(async (req, res) => {
  const customers = await Customer.find().sort({ createdAt: -1 });
  sendSuccess(res, 200, 'Customers retrieved successfully', { customers });
});

/**
 * @desc    Get single customer
 * @route   GET /api/customers/:id
 * @access  Private
 */
const getCustomer = asyncHandler(async (req, res) => {
  const { Site } = require('../models');
  
  const customer = await Customer.findById(req.params.id);
  
  if (!customer) {
    return sendError(res, 404, 'Customer not found');
  }
  
  // Get customer's sites
  const sites = await Site.find({ customer_id: customer._id })
    .select('name domain url status currentUptime paymentAmount paymentCycleMonths')
    .sort({ createdAt: -1 });
  
  // Add sites to customer object
  const customerWithSites = customer.toObject();
  customerWithSites.sites = sites;
  
  sendSuccess(res, 200, 'Customer retrieved successfully', { customer: customerWithSites });
});

/**
 * @desc    Create new customer
 * @route   POST /api/customers
 * @access  Private (Super Admin)
 */
const createCustomer = asyncHandler(async (req, res) => {
  const emailService = require('../services/emailService');
  const { Admin } = require('../models');
  const bcrypt = require('bcryptjs');
  
  // Check if customer email already exists
  const existingCustomer = await Customer.findOne({ email: req.body.email });
  if (existingCustomer) {
    return sendError(res, 400, 'Customer with this email already exists');
  }
  
  // Check if admin with this email already exists
  const existingAdmin = await Admin.findOne({ email: req.body.email });
  if (existingAdmin) {
    return sendError(res, 400, 'An account with this email already exists');
  }
  
  // Create customer
  const customer = await Customer.create(req.body);

  // Generate random password for customer admin
  const rawPassword = Math.random().toString(36).slice(-8) + Math.floor(Math.random()*1000);

  // Create customer admin (password will be hashed by the model's pre-save hook)
  const admin = await Admin.create({
    name: customer.name,
    email: customer.email,
    password: rawPassword,  // Pass raw password - model will hash it
    role: 'customer_admin',
    customer_id: customer._id
  });

  // Send welcome email with credentials
  try {
    await emailService.sendWelcomeEmail({
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      company: customer.company,
      password: rawPassword
    });
    console.log(`✓ Welcome email sent to ${customer.email}`);
  } catch (emailError) {
    console.error('Failed to send welcome email:', emailError.message);
    // Don't fail the request if email fails
  }

  sendSuccess(res, 201, 'Customer created successfully', { customer });
});

/**
 * @desc    Update customer
 * @route   PUT /api/customers/:id
 * @access  Private (Super Admin)
 */
const updateCustomer = asyncHandler(async (req, res) => {
  const customer = await Customer.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );
  
  if (!customer) {
    return sendError(res, 404, 'Customer not found');
  }
  
  sendSuccess(res, 200, 'Customer updated successfully', { customer });
});

/**
 * @desc    Delete customer
 * @route   DELETE /api/customers/:id
 * @access  Private (Super Admin)
 */
const deleteCustomer = asyncHandler(async (req, res) => {
  const { Site, Payment, UptimeLog, Admin } = require('../models');
  
  const customer = await Customer.findById(req.params.id);
  
  if (!customer) {
    return sendError(res, 404, 'Customer not found');
  }
  
  // Find all sites belonging to this customer
  const sites = await Site.find({ customer_id: customer._id });
  const siteIds = sites.map(site => site._id);
  
  // Delete related data
  if (siteIds.length > 0) {
    await UptimeLog.deleteMany({ site_id: { $in: siteIds } });
    await Payment.deleteMany({ site_id: { $in: siteIds } });
    await Site.deleteMany({ customer_id: customer._id });
  }
  
  // Delete associated admin account(s)
  await Admin.deleteMany({ customer_id: customer._id });
  
  // Delete customer
  await customer.deleteOne();
  
  sendSuccess(res, 200, `Customer and ${siteIds.length} related website(s) deleted successfully`);
});

module.exports = {
  getAllCustomers,
  getCustomer,
  createCustomer,
  updateCustomer,
  deleteCustomer
};
