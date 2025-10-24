const axios = require('axios');
const { Site, UptimeLog } = require('../models');

/**
 * Uptime Checker Service
 * Monitors website availability and logs results
 */
class UptimeCheckerService {
  constructor() {
    this.timeout = (parseInt(process.env.UPTIME_TIMEOUT_SECONDS) || 30) * 1000;
  }

  /**
   * Check if a single website is up
   * @param {Object} site - Site document from database
   * @returns {Object} Check result
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
      // Ensure domain has protocol
      let url = site.domain;
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }

      const response = await axios.get(url, {
        timeout: this.timeout,
        validateStatus: (status) => status < 500, // Accept all status codes < 500
        maxRedirects: 5,
        headers: {
          'User-Agent': 'Website-Management-System-Uptime-Monitor/1.0'
        }
      });

      result.statusCode = response.status;
      result.responseTime = Date.now() - startTime;

      // Consider 2xx and 3xx as "up"
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
   * Check all active sites
   * @returns {Array} Array of check results
   */
  async checkAllSites() {
    try {
      // Only check active sites (not suspended or inactive)
      const sites = await Site.find({ 
        status: { $in: ['active', 'suspended'] } // Check suspended sites too for monitoring
      });

      console.log(`Checking uptime for ${sites.length} sites...`);
      
      const results = [];

      for (const site of sites) {
        const checkResult = await this.checkSite(site);
        
        // Save log to database
        await UptimeLog.create(checkResult);
        
        // Update site's current status
        const wasDown = site.isCurrentlyDown;
        const isNowDown = checkResult.status !== 'up';
        
        site.lastUptimeCheck = checkResult.checkedAt;
        site.isCurrentlyDown = isNowDown;
        
        if (isNowDown && !wasDown) {
          site.lastDowntime = checkResult.checkedAt;
          console.log(`⚠️  Site DOWN: ${site.domain}`);
        } else if (!isNowDown && wasDown) {
          console.log(`✅ Site RECOVERED: ${site.domain}`);
        }
        
        // Calculate uptime percentage for last 24 hours
        const uptimePercentage = await UptimeLog.calculateUptime(site._id, 24);
        site.currentUptime = uptimePercentage;
        
        await site.save();
        
        results.push({
          siteId: site._id,
          domain: site.domain,
          status: checkResult.status,
          responseTime: checkResult.responseTime,
          uptime: uptimePercentage
        });
      }

      console.log(`Uptime check completed for ${results.length} sites`);
      return results;

    } catch (error) {
      console.error('Error in checkAllSites:', error.message);
      throw error;
    }
  }

  /**
   * Get uptime statistics for a site
   * @param {String} siteId - Site ID
   * @param {Number} hours - Hours to look back (default 24)
   * @returns {Object} Uptime statistics
   */
  async getSiteUptimeStats(siteId, hours = 24) {
    try {
      const uptimePercentage = await UptimeLog.calculateUptime(siteId, hours);
      const downtimeIncidents = await UptimeLog.getDowntimeIncidents(siteId, hours);
      const avgResponseTime = await UptimeLog.getAverageResponseTime(siteId, hours);

      return {
        uptimePercentage,
        downtimeIncidents: downtimeIncidents.length,
        avgResponseTime,
        period: `Last ${hours} hours`
      };
    } catch (error) {
      console.error('Error getting uptime stats:', error.message);
      throw error;
    }
  }

  /**
   * Get sites that are currently down
   * @returns {Array} Array of down sites
   */
  async getDownSites() {
    try {
      const downSites = await Site.find({ 
        isCurrentlyDown: true,
        status: 'active' // Only active sites
      }).populate('customer_id', 'name email phone');

      return downSites;
    } catch (error) {
      console.error('Error getting down sites:', error.message);
      throw error;
    }
  }
}

// Export singleton instance
module.exports = new UptimeCheckerService();
