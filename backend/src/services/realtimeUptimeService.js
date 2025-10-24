const axios = require('axios');
const { Site, UptimeLog } = require('../models');

/**
 * Real-time Uptime Monitoring Service
 * Checks websites every 20 seconds for immediate feedback
 */
class RealtimeUptimeService {
  constructor() {
    this.timeout = 10000; // 10 second timeout
    this.checkInterval = 20000; // 20 seconds
    this.activeChecks = new Map(); // Store interval IDs
    this.isRunning = false;
  }

  /**
   * Check if a single website is up
   */
  async checkSite(site) {
    const startTime = Date.now();
    let result = {
      site_id: site._id,
      checkedAt: new Date(),
      status: 'down',
      statusCode: null,
      responseTime: null,
      errorMessage: null
    };

    try {
      // Ensure URL has protocol
      let url = site.domain;
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }

      const response = await axios.get(url, {
        timeout: this.timeout,
        validateStatus: (status) => status < 500,
        maxRedirects: 5,
        headers: {
          'User-Agent': 'Website-Management-System-Monitor/2.0'
        }
      });

      result.statusCode = response.status;
      result.responseTime = Date.now() - startTime;

      // 2xx and 3xx = up
      if (response.status >= 200 && response.status < 400) {
        result.status = 'up';
      } else {
        result.status = 'down';
        result.errorMessage = `HTTP ${response.status}`;
      }

    } catch (error) {
      result.responseTime = Date.now() - startTime;
      
      if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
        result.status = 'timeout';
        result.errorMessage = 'Connection timeout';
      } else if (error.response) {
        result.status = 'down';
        result.statusCode = error.response.status;
        result.errorMessage = `HTTP ${error.response.status}`;
      } else {
        result.status = 'error';
        result.errorMessage = error.message || 'Connection failed';
      }
    }

    return result;
  }

  /**
   * Calculate real-time uptime percentage for a site
   */
  async calculateUptime(siteId, hours = 1) {
    const timeAgo = new Date();
    timeAgo.setHours(timeAgo.getHours() - hours);

    const logs = await UptimeLog.find({
      site_id: siteId,
      checkedAt: { $gte: timeAgo }
    });

    if (logs.length === 0) return 100; // No data = assume up

    const upLogs = logs.filter(log => log.status === 'up');
    return (upLogs.length / logs.length) * 100;
  }

  /**
   * Perform a single check for a specific site
   */
  async performSiteCheck(siteId) {
    try {
      const site = await Site.findById(siteId);
      if (!site) {
        console.error(`Site ${siteId} not found`);
        // Stop monitoring this site since it's deleted
        this.stopMonitoringSite(siteId);
        return null;
      }

      // Perform check
      const checkResult = await this.checkSite(site);
      
      // Save to database
      await UptimeLog.create(checkResult);
      
      // Update site status
      site.isCurrentlyDown = checkResult.status !== 'up';
      site.lastUptimeCheck = checkResult.checkedAt;
      
      // Calculate uptime percentages
      const uptime1h = await this.calculateUptime(siteId, 1);
      const uptime24h = await this.calculateUptime(siteId, 24);
      const uptime7d = await this.calculateUptime(siteId, 168);
      const uptime30d = await this.calculateUptime(siteId, 720);
      
      // Update site's current uptime (use 24h average)
      site.currentUptime = uptime24h;
      
      await site.save();

      console.log(`✓ Checked ${site.domain}: ${checkResult.status} (${checkResult.responseTime}ms) - Uptime: ${uptime1h.toFixed(2)}%`);
      
      return {
        ...checkResult,
        uptime1h,
        uptime24h,
        uptime7d,
        uptime30d
      };

    } catch (error) {
      console.error(`Error checking site ${siteId}:`, error.message);
      return null;
    }
  }

  /**
   * Start monitoring a specific site every 20 seconds
   */
  startMonitoringSite(siteId) {
    // Don't start if already monitoring
    if (this.activeChecks.has(siteId)) {
      return;
    }

    console.log(`Starting real-time monitoring for site ${siteId}`);
    
    // Immediate first check
    this.performSiteCheck(siteId);
    
    // Then check every 20 seconds
    const intervalId = setInterval(() => {
      this.performSiteCheck(siteId);
    }, this.checkInterval);
    
    this.activeChecks.set(siteId, intervalId);
  }

  /**
   * Stop monitoring a specific site
   */
  stopMonitoringSite(siteId) {
    const intervalId = this.activeChecks.get(siteId);
    if (intervalId) {
      clearInterval(intervalId);
      this.activeChecks.delete(siteId);
      console.log(`Stopped monitoring site ${siteId}`);
    }
  }

  /**
   * Start monitoring all active sites
   */
  async startMonitoringAll() {
    if (this.isRunning) {
      console.log('Real-time monitoring already running');
      return;
    }

    console.log('Starting real-time uptime monitoring (20 second intervals)...');
    this.isRunning = true;

    // Get all active sites
    const sites = await Site.find({ status: 'active' });
    
    for (const site of sites) {
      this.startMonitoringSite(site._id.toString());
    }

    console.log(`✓ Monitoring ${sites.length} active sites`);
  }

  /**
   * Stop monitoring all sites
   */
  stopMonitoringAll() {
    console.log('Stopping real-time monitoring...');
    
    for (const [siteId, intervalId] of this.activeChecks) {
      clearInterval(intervalId);
    }
    
    this.activeChecks.clear();
    this.isRunning = false;
    console.log('✓ Real-time monitoring stopped');
  }

  /**
   * Get monitoring status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      activeSites: Array.from(this.activeChecks.keys()),
      checkInterval: this.checkInterval,
      timeout: this.timeout
    };
  }

  /**
   * Refresh monitoring - stop all and restart with current active sites
   */
  async refreshMonitoring() {
    console.log('Refreshing real-time monitoring...');
    
    // Stop all current monitoring
    this.stopMonitoringAll();
    
    // Wait a bit
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Restart with current active sites
    await this.startMonitoringAll();
    
    console.log('✓ Monitoring refreshed');
  }
}

// Singleton instance
const realtimeUptimeService = new RealtimeUptimeService();

module.exports = realtimeUptimeService;
