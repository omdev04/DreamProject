const cron = require('node-cron');
const billingService = require('../services/billingService');

/**
 * Billing Check Cron Job
 * Runs daily at 9:00 AM to check payments and send reminders
 */
const startBillingCron = () => {
  // Cron expression: 0 9 * * * means every day at 9:00 AM
  const cronExpression = '0 9 * * *';
  
  cron.schedule(cronExpression, async () => {
    console.log(`\n[${new Date().toISOString()}] Running daily billing check cron job...`);
    
    try {
      const result = await billingService.processDailyBillingChecks();
      console.log(`Billing check completed: ${result.remindersSent} reminders sent, ${result.suspensionsProcessed} sites suspended\n`);
    } catch (error) {
      console.error('Error in billing cron job:', error.message);
    }
  });
  
  console.log('✓ Billing cron job scheduled (daily at 9:00 AM)');
};

module.exports = { startBillingCron };
