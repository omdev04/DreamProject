const mongoose = require('mongoose');

/**
 * Customer Schema
 * Represents clients whose websites are managed by the company
 */
const customerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Customer name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true
  },
  company: {
    type: String,
    trim: true
  },
  address: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  billingEmail: {
    type: String,
    lowercase: true,
    trim: true
  },
  notes: {
    type: String
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Virtual for getting all sites for this customer
customerSchema.virtual('sites', {
  ref: 'Site',
  localField: '_id',
  foreignField: 'customer_id'
});

module.exports = mongoose.model('Customer', customerSchema);
