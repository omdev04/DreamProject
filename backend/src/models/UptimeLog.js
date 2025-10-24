const mongoose = require('mongoose');

/**
 * UptimeLog Schema
 * Stores individual uptime check results
 */
const uptimeLogSchema = new mongoose.Schema({
  site_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Site',
    required: [true, 'Site ID is required'],
    index: true
  },
  checkedAt: {
    type: Date,
    default: Date.now,
    required: true
  },
  status: {
    type: String,
    enum: ['up', 'down', 'timeout', 'error'],
    required: true
  },
  statusCode: {
    type: Number
  },
  responseTime: {
    type: Number, // in milliseconds
    min: 0
  },
  errorMessage: {
    type: String
  },
  // Additional metadata
  headers: {
    type: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: false // We use checkedAt instead
});

// Compound index for efficient time-range queries
uptimeLogSchema.index({ site_id: 1, checkedAt: -1 });

// Static method to calculate uptime percentage for a site
uptimeLogSchema.statics.calculateUptime = async function(siteId, hoursBack = 24) {
  const startTime = new Date();
  startTime.setHours(startTime.getHours() - hoursBack);
  
  const logs = await this.find({
    site_id: siteId,
    checkedAt: { $gte: startTime }
  });
  
  if (logs.length === 0) {
    return 100; // No data means assume 100% uptime
  }
  
  const upCount = logs.filter(log => log.status === 'up').length;
  const uptimePercentage = (upCount / logs.length) * 100;
  
  return Math.round(uptimePercentage * 100) / 100; // Round to 2 decimal places
};

// Static method to get downtime incidents
uptimeLogSchema.statics.getDowntimeIncidents = async function(siteId, hoursBack = 24) {
  const startTime = new Date();
  startTime.setHours(startTime.getHours() - hoursBack);
  
  const logs = await this.find({
    site_id: siteId,
    checkedAt: { $gte: startTime },
    status: { $ne: 'up' }
  }).sort({ checkedAt: -1 });
  
  return logs;
};

// Static method to get average response time
uptimeLogSchema.statics.getAverageResponseTime = async function(siteId, hoursBack = 24) {
  const startTime = new Date();
  startTime.setHours(startTime.getHours() - hoursBack);
  
  const result = await this.aggregate([
    {
      $match: {
        site_id: mongoose.Types.ObjectId(siteId),
        checkedAt: { $gte: startTime },
        status: 'up',
        responseTime: { $exists: true }
      }
    },
    {
      $group: {
        _id: null,
        avgResponseTime: { $avg: '$responseTime' }
      }
    }
  ]);
  
  return result.length > 0 ? Math.round(result[0].avgResponseTime) : 0;
};

// TTL index to automatically delete old logs after 90 days
uptimeLogSchema.index({ checkedAt: 1 }, { expireAfterSeconds: 7776000 }); // 90 days

module.exports = mongoose.model('UptimeLog', uptimeLogSchema);
