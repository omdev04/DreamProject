/**
 * Centralized export for all Mongoose models
 */
module.exports = {
  Admin: require('./Admin'),
  Customer: require('./Customer'),
  Site: require('./Site'),
  Payment: require('./Payment'),
  UptimeLog: require('./UptimeLog')
};
