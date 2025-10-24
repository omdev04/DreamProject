const { startUptimeCron } = require('./uptimeCron');
const { startBillingCron } = require('./billingCron');

/**
 * Initialize all cron jobs
 */
const initializeCronJobs = () => {
  console.log('\n=== Initializing Cron Jobs ===');
  
  startUptimeCron();
  startBillingCron();
  
  console.log('=== All cron jobs initialized ===\n');
};

module.exports = { initializeCronJobs };
