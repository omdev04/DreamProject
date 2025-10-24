const mongoose = require('mongoose');
const crypto = require('crypto');

/**
 * Site Schema
 * Represents individual client websites being managed
 */
const siteSchema = new mongoose.Schema({
  customer_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: [true, 'Customer ID is required']
  },
  domain: {
    type: String,
    required: [true, 'Domain is required'],
    unique: true,
    trim: true,
    lowercase: true
  },
  name: {
    type: String,
    required: [true, 'Site name is required'],
    trim: true
  },
  description: {
    type: String
  },
  // API Key for widget authentication
  apiKey: {
    type: String,
    unique: true,
    sparse: true, // Allow null/undefined temporarily (will be set by pre-save hook)
    index: true,
    immutable: true // Prevent accidental updates - can only be changed via regenerateApiKey method
  },
  apiKeyCreatedAt: {
    type: Date,
    default: Date.now,
    immutable: true // Lock creation timestamp
  },
  apiKeyLastUsed: {
    type: Date
  },
  status: {
    type: String,
    enum: ['active', 'suspended', 'inactive'],
    default: 'active'
  },
  // Maintenance mode
  maintenanceMode: {
    type: Boolean,
    default: false
  },
  maintenanceMessage: {
    type: String,
    default: 'We are currently performing scheduled maintenance. Please check back soon.'
  },
  maintenanceEnabledAt: {
    type: Date
  },
  maintenanceEnabledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  // Billing information
  paymentAmount: {
    type: Number,
    required: [true, 'Payment amount is required'],
    default: 500
  },
  paymentCycleMonths: {
    type: Number,
    default: 3 // Every 3 months
  },
  nextPaymentDate: {
    type: Date,
    required: [true, 'Next payment date is required']
  },
  lastPaymentDate: {
    type: Date
  },
  // Uptime tracking
  currentUptime: {
    type: Number,
    default: 100,
    min: 0,
    max: 100
  },
  lastUptimeCheck: {
    type: Date
  },
  lastDowntime: {
    type: Date
  },
  isCurrentlyDown: {
    type: Boolean,
    default: false
  },
  // Suspension tracking
  suspensionReason: {
    type: String,
    enum: ['payment_overdue', 'manual', 'none'],
    default: 'none'
  },
  suspendedAt: {
    type: Date
  },
  suspendedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  // Grace period tracking
  gracePeriodExpired: {
    type: Boolean,
    default: false
  },
  gracePeriodExpiredAt: {
    type: Date
  },
  // Technology stack (optional metadata)
  technology: {
    platform: String,
    framework: String,
    database: String
  },
  // Notifications
  notificationEmails: [{
    type: String,
    lowercase: true
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for efficient querying
siteSchema.index({ customer_id: 1, status: 1 });
siteSchema.index({ nextPaymentDate: 1 });
siteSchema.index({ status: 1 });
siteSchema.index({ apiKey: 1 }); // Index for API key lookups

// Generate secure API key (before save)
siteSchema.pre('save', function(next) {
  // Only generate API key if it's a new site or apiKey doesn't exist
  if (this.isNew || !this.apiKey) {
    // Generate 64-character hex API key
    this.apiKey = crypto.randomBytes(32).toString('hex');
    this.apiKeyCreatedAt = new Date();
  }
  
  // Prevent accidental API key modification on existing sites
  // Allow changes only if _allowApiKeyChange flag is set (via regenerateApiKey method)
  if (!this.isNew && this.isModified('apiKey') && !this._allowApiKeyChange) {
    // Block unauthorized API key changes
    const error = new Error('API key cannot be modified directly. Use regenerateApiKey() method.');
    return next(error);
  }
  
  next();
});

// Method to regenerate API key
siteSchema.methods.regenerateApiKey = function() {
  // Store flag to allow API key change
  this._allowApiKeyChange = true;
  
  // Generate new API key
  this.apiKey = crypto.randomBytes(32).toString('hex');
  this.apiKeyCreatedAt = new Date();
  
  return this.save();
};

// Method to check if site is overdue
siteSchema.methods.isPaymentOverdue = function() {
  return new Date() > this.nextPaymentDate && this.status !== 'suspended';
};

// Method to calculate grace period end date
siteSchema.methods.getGracePeriodEndDate = function() {
  const graceDays = parseInt(process.env.GRACE_PERIOD_DAYS) || 10;
  const endDate = new Date(this.nextPaymentDate);
  endDate.setDate(endDate.getDate() + graceDays);
  return endDate;
};

// Method to check if grace period has passed
siteSchema.methods.isGracePeriodExpired = function() {
  return new Date() > this.getGracePeriodEndDate();
};

// Virtual for days until payment
siteSchema.virtual('daysUntilPayment').get(function() {
  const today = new Date();
  const paymentDate = new Date(this.nextPaymentDate);
  const diffTime = paymentDate - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

module.exports = mongoose.model('Site', siteSchema);
