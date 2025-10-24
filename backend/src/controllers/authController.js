const { Admin } = require('../models');
const { generateToken } = require('../utils/jwtUtils');
const { sendSuccess, sendError, asyncHandler } = require('../utils/responseUtils');

/**
 * @desc    Login admin (super admin or customer admin)
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Validate input
  if (!email || !password) {
    return sendError(res, 400, 'Please provide email and password');
  }

  // Find admin with password field
  const admin = await Admin.findOne({ email }).select('+password');

  if (!admin) {
    return sendError(res, 401, 'Invalid credentials');
  }

  // Check if account is active
  if (!admin.isActive) {
    return sendError(res, 403, 'Account is disabled. Please contact support');
  }

  // Check password
  const isPasswordValid = await admin.comparePassword(password);

  if (!isPasswordValid) {
    return sendError(res, 401, 'Invalid credentials');
  }

  // Update last login
  admin.lastLogin = new Date();
  await admin.save();

  // Generate token
  const token = generateToken({
    id: admin._id,
    role: admin.role
  });

  // Send response (exclude password)
  const adminData = admin.toObject();
  delete adminData.password;

  sendSuccess(res, 200, 'Login successful', {
    admin: adminData,
    token
  });
});

/**
 * @desc    Register new customer admin
 * @route   POST /api/auth/register
 * @access  Private (Super Admin only)
 */
const register = asyncHandler(async (req, res) => {
  const { name, email, password, customer_id } = req.body;

  // Validate input
  if (!name || !email || !password || !customer_id) {
    return sendError(res, 400, 'Please provide all required fields');
  }

  // Check if admin already exists
  const existingAdmin = await Admin.findOne({ email });
  if (existingAdmin) {
    return sendError(res, 400, 'Admin with this email already exists');
  }

  // Create new admin
  const admin = await Admin.create({
    name,
    email,
    password,
    customer_id,
    role: 'customer_admin'
  });

  // Generate token
  const token = generateToken({
    id: admin._id,
    role: admin.role
  });

  // Send response
  const adminData = admin.toObject();
  delete adminData.password;

  sendSuccess(res, 201, 'Admin registered successfully', {
    admin: adminData,
    token
  });
});

/**
 * @desc    Get current logged-in admin profile
 * @route   GET /api/auth/me
 * @access  Private
 */
const getProfile = asyncHandler(async (req, res) => {
  const admin = await Admin.findById(req.admin._id).populate('customer_id');

  if (!admin) {
    return sendError(res, 404, 'Admin not found');
  }

  sendSuccess(res, 200, 'Profile retrieved successfully', { admin });
});

/**
 * @desc    Update admin profile
 * @route   PUT /api/auth/profile
 * @access  Private
 */
const updateProfile = asyncHandler(async (req, res) => {
  const { name, email } = req.body;

  const admin = await Admin.findById(req.admin._id);

  if (!admin) {
    return sendError(res, 404, 'Admin not found');
  }

  if (name) admin.name = name;
  if (email) admin.email = email;

  await admin.save();

  sendSuccess(res, 200, 'Profile updated successfully', { admin });
});

/**
 * @desc    Change password
 * @route   PUT /api/auth/change-password
 * @access  Private
 */
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return sendError(res, 400, 'Please provide current and new password');
  }

  const admin = await Admin.findById(req.admin._id).select('+password');

  if (!admin) {
    return sendError(res, 404, 'Admin not found');
  }

  // Verify current password
  const isPasswordValid = await admin.comparePassword(currentPassword);

  if (!isPasswordValid) {
    return sendError(res, 401, 'Current password is incorrect');
  }

  // Update password
  admin.password = newPassword;
  await admin.save();

  sendSuccess(res, 200, 'Password changed successfully');
});

module.exports = {
  login,
  register,
  getProfile,
  updateProfile,
  changePassword
};
