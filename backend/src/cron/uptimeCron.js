const cron = require('node-cron');
const uptimeService = require('../services/uptimeService');

/**
 * Uptime Check Cron Job
 * Runs every 10 minutes to check website uptime
 */
const startUptimeCron = () => {
  const intervalMinutes = parseInt(process.env.UPTIME_CHECK_INTERVAL_MINUTES) || 10;
  
  // Cron expression: */10 * * * * means every 10 minutes
  const cronExpression = `*/${intervalMinutes} * * * *`;
  
  cron.schedule(cronExpression, async () => {
    console.log(`\n[${new Date().toISOString()}] Running uptime check cron job...`);
    
    try {
      await uptimeService.checkAllSites();
      console.log('Uptime check completed successfully\n');
    } catch (error) {
      console.error('Error in uptime cron job:', error.message);
    }
  });
  
  console.log(`✓ Uptime cron job scheduled (every ${intervalMinutes} minutes)`);
};

module.exports = { startUptimeCron };
