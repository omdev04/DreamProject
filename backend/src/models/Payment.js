const mongoose = require('mongoose');

/**
 * Payment Schema
 * Tracks all payment transactions and proof uploads
 */
const paymentSchema = new mongoose.Schema({
  site_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Site',
    required: [true, 'Site ID is required']
  },
  customer_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: [true, 'Customer ID is required']
  },
  invoiceNumber: {
    type: String,
    unique: true,
    sparse: true // Allow undefined during creation (will be set by pre-save hook)
  },
  amount: {
    type: Number,
    required: [true, 'Payment amount is required'],
    min: 0
  },
  dueDate: {
    type: Date,
    required: [true, 'Due date is required']
  },
  paidDate: {
    type: Date
  },
  status: {
    type: String,
    enum: ['pending', 'proof_uploaded', 'paid', 'overdue', 'cancelled'],
    default: 'pending'
  },
  // Payment proof upload
  proofUrl: {
    type: String
  },
  proofUploadedAt: {
    type: Date
  },
  proofUploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  // Manual verification by super admin
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  verifiedAt: {
    type: Date
  },
  verificationNotes: {
    type: String
  },
  // Payment period covered
  periodStart: {
    type: Date,
    required: true
  },
  periodEnd: {
    type: Date,
    required: true
  },
  // Reminders sent
  remindersSent: [{
    type: {
      type: String,
      enum: ['10_days_before', 'due_date', '10_days_after']
    },
    sentAt: Date
  }],
  notes: {
    type: String
  },
  // Bill/Invoice PDF
  billUrl: {
    type: String
  },
  billGeneratedAt: {
    type: Date
  },
  // For future payment gateway integration
  // FUTURE: Add fields like gateway_transaction_id, gateway_response, etc.
  gatewayTransactionId: {
    type: String
  },
  gatewayResponse: {
    type: mongoose.Schema.Types.Mixed
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for efficient querying
paymentSchema.index({ site_id: 1, status: 1 });
paymentSchema.index({ customer_id: 1 });
paymentSchema.index({ dueDate: 1 });
paymentSchema.index({ status: 1, dueDate: 1 });

// Generate invoice number before saving
paymentSchema.pre('save', async function(next) {
  if (this.isNew && !this.invoiceNumber) {
    const count = await mongoose.model('Payment').countDocuments();
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    this.invoiceNumber = `INV-${year}${month}-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

// Method to check if payment is overdue
paymentSchema.methods.isOverdue = function() {
  return this.status === 'pending' && new Date() > this.dueDate;
};

// Method to mark reminder as sent
paymentSchema.methods.markReminderSent = async function(reminderType) {
  this.remindersSent.push({
    type: reminderType,
    sentAt: new Date()
  });
  await this.save();
};

// Method to check if specific reminder was already sent
paymentSchema.methods.wasReminderSent = function(reminderType) {
  return this.remindersSent.some(r => r.type === reminderType);
};

module.exports = mongoose.model('Payment', paymentSchema);
