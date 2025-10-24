/**
 * Panaglo - Website Monitoring Widget
 * Automatically checks site status and shows suspended page if needed
 * 
 * Usage: <script src="https://your-domain.com/widget.js" data-api-key="YOUR_API_KEY"></script>
 */

(function() {
  'use strict';

  // Configuration
  const CONFIG = {
    API_URL: window.WIDGET_API_URL || 'http://localhost:5000',
    CHECK_INTERVAL: 20000,
    API_KEY: null,
    CACHE_DURATION: 30000 // 30 seconds cache
  };

  // Get API key from script tag
  const currentScript = document.currentScript || document.querySelector('script[data-api-key]');
  if (currentScript) {
    CONFIG.API_KEY = currentScript.getAttribute('data-api-key');
  }

  // Fallback for old attribute
  if (!CONFIG.API_KEY) {
    const oldScript = document.querySelector('script[data-site-id]');
    if (oldScript) {
      CONFIG.API_KEY = oldScript.getAttribute('data-site-id');
    }
  }

  if (!CONFIG.API_KEY) {
    return;
  }

  // Quick cache check before hiding body (synchronous, instant)
  let cachedStatus = null;
  try {
    const cached = localStorage.getItem('widget_status_cache_' + CONFIG.API_KEY);
    if (cached) {
      const data = JSON.parse(cached);
      if (Date.now() - data.timestamp < 30000) { // 30 seconds
        cachedStatus = data.status;
      }
    }
  } catch (e) {}

  // Only hide body if not suspended/maintenance in cache
  if (!cachedStatus || (cachedStatus.status === 'active' && !cachedStatus.maintenanceMode)) {
    const instantHide = document.createElement('style');
    instantHide.id = 'widget-instant-hide';
    instantHide.textContent = 'body{visibility:hidden!important;opacity:0!important;transition:opacity 0.3s ease!important;}';
    (document.head || document.documentElement).appendChild(instantHide);
  }

  // State
  let lastStatus = null;
  let warningBanner = null;
  let firstCheckDone = false;

  /**
   * Get cached status
   */
  function getCachedStatus() {
    try {
      const cached = localStorage.getItem('widget_status_cache_' + CONFIG.API_KEY);
      if (!cached) return null;
      
      const data = JSON.parse(cached);
      const now = Date.now();
      
      // Check if cache is still valid (30 seconds)
      if (now - data.timestamp < CONFIG.CACHE_DURATION) {
        return data.status;
      }
      
      // Cache expired
      localStorage.removeItem('widget_status_cache_' + CONFIG.API_KEY);
      return null;
    } catch (e) {
      return null;
    }
  }

  /**
   * Save status to cache
   */
  function setCachedStatus(statusData) {
    try {
      const cacheData = {
        status: statusData,
        timestamp: Date.now()
      };
      localStorage.setItem('widget_status_cache_' + CONFIG.API_KEY, JSON.stringify(cacheData));
    } catch (e) {
      // Silently fail if localStorage is blocked
    }
  }

  /**
   * Show website (remove instant hide)
   */
  function showWebsite() {
    const hideStyle = document.getElementById('widget-instant-hide');
    if (hideStyle) {
      document.body.style.visibility = 'visible';
      document.body.style.opacity = '1';
      setTimeout(() => hideStyle.remove(), 300);
    }
  }

  // Safety timeout: Show website after 5 seconds if API doesn't respond
  setTimeout(() => {
    if (!firstCheckDone) {
      showWebsite();
      firstCheckDone = true;
    }
  }, 5000);
  
  /**
   * Check if owner mode is enabled
   * Owner mode allows website owner to see payment warnings
   * Enable via: ?owner=true in URL or localStorage
   */
  function isOwnerMode() {
    // Check URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('owner') === 'true') {
      // Save to localStorage for future visits
      try {
        localStorage.setItem('widget_owner_mode', 'true');
      } catch (e) {
        // LocalStorage might be blocked
      }
      return true;
    }
    
    // Check if manually disabled
    if (urlParams.get('owner') === 'false') {
      try {
        localStorage.removeItem('widget_owner_mode');
      } catch (e) {
        // LocalStorage might be blocked
      }
      return false;
    }
    
    // Check localStorage
    try {
      return localStorage.getItem('widget_owner_mode') === 'true';
    } catch (e) {
      return false;
    }
  }

  /**
   * Check site status from API
   */
  async function checkStatus() {
    try {
      const response = await fetch(`${CONFIG.API_URL}/api/public/check-status/${CONFIG.API_KEY}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (!firstCheckDone) {
          showWebsite();
          firstCheckDone = true;
        }
        return;
      }

      const data = await response.json();
      handleStatusUpdate(data.data);
      
      if (!firstCheckDone) {
        firstCheckDone = true;
      }

    } catch (error) {
      if (!firstCheckDone) {
        showWebsite();
        firstCheckDone = true;
      }
      // Don't block website if monitoring API is down
    }
  }

  /**
   * Handle status update from API
   */
  function handleStatusUpdate(data) {
    if (!data) {
      showWebsite();
      return;
    }

    const { status, reason, message, maintenanceMode, maintenanceMessage, paymentDue, dueAmount, dueDate, paymentUrl } = data;

    // Save to cache for next page load
    setCachedStatus(data);

    if (lastStatus !== status) {
      lastStatus = status;
    }

    // Maintenance mode (highest priority)
    if (maintenanceMode) {
      showMaintenancePage(maintenanceMessage);
      return;
    }

    // Suspended page
    if (status === 'suspended') {
      showSuspendedPage(reason, message, paymentUrl);
      return;
    }

    // Site is active - show website
    removeMaintenancePage();
    removeSuspendedPage();
    showWebsite();

    // Payment warning (owner mode only)
    if (paymentDue && status === 'active' && isOwnerMode()) {
      showPaymentWarning(dueAmount, dueDate, paymentUrl);
    } else {
      removePaymentWarning();
    }
  }
  /**
   * Show suspended page (blocks entire website)
   */
  function showSuspendedPage(reason, message, paymentUrl) {
    // Remove instant hide first
    showWebsite();
    
    // Create suspended page overlay with new glassmorphism design
    const suspendedHTML = `
      <div id="widget-suspended-overlay" style="
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100vh;
        background: #05020fff;
        z-index: 999999;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        overflow: hidden;
        padding: 10px;
        box-sizing: border-box;
      ">
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;700&family=Space+Grotesk:wght@400;600;700&display=swap');
          
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          
          @keyframes fallDown {
            0% { transform: translateY(-100vh); opacity: 0; }
            10% { opacity: 0.5; }
            90% { opacity: 0.5; }
            100% { transform: translateY(100vh); opacity: 0; }
          }
          
          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-20px); }
          }
          
          .suspended-container {
            animation: fadeIn 0.6s ease-out;
          }
          
          .falling-particle {
            position: absolute;
            width: 2px;
            height: 80px;
            background: linear-gradient(to bottom, transparent, rgba(252, 177, 177, 0.3), transparent);
            animation: fallDown linear infinite;
            border-radius: 50%;
          }
          
          .falling-particle:nth-child(1) { left: 5%; animation-duration: 8s; animation-delay: 0s; height: 60px; }
          .falling-particle:nth-child(2) { left: 15%; animation-duration: 10s; animation-delay: 2s; height: 90px; }
          .falling-particle:nth-child(3) { left: 25%; animation-duration: 7s; animation-delay: 1s; height: 70px; }
          .falling-particle:nth-child(4) { left: 35%; animation-duration: 9s; animation-delay: 3s; height: 85px; }
          .falling-particle:nth-child(5) { left: 45%; animation-duration: 11s; animation-delay: 0.5s; height: 75px; }
          .falling-particle:nth-child(6) { left: 55%; animation-duration: 8.5s; animation-delay: 2.5s; height: 65px; }
          .falling-particle:nth-child(7) { left: 65%; animation-duration: 10.5s; animation-delay: 1.5s; height: 95px; }
          .falling-particle:nth-child(8) { left: 75%; animation-duration: 9.5s; animation-delay: 0.8s; height: 80px; }
          .falling-particle:nth-child(9) { left: 85%; animation-duration: 7.5s; animation-delay: 2.2s; height: 70px; }
          .falling-particle:nth-child(10) { left: 95%; animation-duration: 8.8s; animation-delay: 1.8s; height: 88px; }
          .falling-particle:nth-child(11) { left: 10%; animation-duration: 12s; animation-delay: 3.5s; height: 75px; }
          .falling-particle:nth-child(12) { left: 20%; animation-duration: 9.2s; animation-delay: 0.3s; height: 82px; }
          .falling-particle:nth-child(13) { left: 30%; animation-duration: 10.8s; animation-delay: 2.8s; height: 68px; }
          .falling-particle:nth-child(14) { left: 40%; animation-duration: 8.3s; animation-delay: 1.3s; height: 92px; }
          .falling-particle:nth-child(15) { left: 50%; animation-duration: 11.5s; animation-delay: 0.2s; height: 78px; }
          .falling-particle:nth-child(16) { left: 60%; animation-duration: 7.8s; animation-delay: 2.9s; height: 72px; }
          .falling-particle:nth-child(17) { left: 70%; animation-duration: 9.8s; animation-delay: 1.1s; height: 86px; }
          .falling-particle:nth-child(18) { left: 80%; animation-duration: 10.3s; animation-delay: 3.2s; height: 74px; }
          .falling-particle:nth-child(19) { left: 90%; animation-duration: 8.7s; animation-delay: 0.9s; height: 84px; }
          .falling-particle:nth-child(20) { left: 12%; animation-duration: 11.2s; animation-delay: 2.6s; height: 76px; }
        </style>
        
        <!-- Falling Particles Background -->
        <div style="position: absolute; inset: 0; overflow: hidden; pointer-events: none;">
          <div class="falling-particle"></div>
          <div class="falling-particle"></div>
          <div class="falling-particle"></div>
          <div class="falling-particle"></div>
          <div class="falling-particle"></div>
          <div class="falling-particle"></div>
          <div class="falling-particle"></div>
          <div class="falling-particle"></div>
          <div class="falling-particle"></div>
          <div class="falling-particle"></div>
          <div class="falling-particle"></div>
          <div class="falling-particle"></div>
          <div class="falling-particle"></div>
          <div class="falling-particle"></div>
          <div class="falling-particle"></div>
          <div class="falling-particle"></div>
          <div class="falling-particle"></div>
          <div class="falling-particle"></div>
          <div class="falling-particle"></div>
          <div class="falling-particle"></div>
        </div>
        
        <!-- Main Container -->
        <div class="suspended-container" style="
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
          border-radius: 20px;
          padding: 50px 40px;
          max-width: 600px;
          width: 100%;
          text-align: center;
        ">
          
          <!-- Suspended Icon/Image -->
          <div><img src="frontend/public/suspended.png" alt="Suspended"></div>          
          <!-- Main Message -->
          <p style="
            font-family: 'Poppins', sans-serif;
            font-size: 18px;
            color: #e0e0e0;
            line-height: 1.8;
            margin: 20px 0;
            font-weight: 300;
          ">
            This website is currently <span style="color: #ff6b6b; font-weight: 600;">suspended due to non-payment</span>. 
            Please clear the outstanding dues immediately to restore all services.
          </p>
          
          <!-- Reason Box (if reason provided) -->
          ${reason ? `
            <div style="
              backdrop-filter: blur(5px);
              -webkit-backdrop-filter: blur(5px);
              background: rgba(255, 107, 107, 0.1);
              border: 1px solid rgba(255, 107, 107, 0.3);
              color: white;
              padding: 20px;
              border-radius: 12px;
              margin-top: 25px;
              font-size: 15px;
              font-family: 'Poppins', sans-serif;
              font-weight: 400;
              text-align: left;
            ">
              <strong>⚠️ Suspension Reason:</strong><br>
              <span style="color: #fca5a5; margin-top: 8px; display: block;">${getReasonText(reason)}</span>
            </div>
          ` : ''}
          
        
          
        </div>
      </div>
    `;

    // Check if overlay already exists
    let overlay = document.getElementById('widget-suspended-overlay');
    if (!overlay) {
      // Insert at the very beginning of body
      document.body.insertAdjacentHTML('afterbegin', suspendedHTML);
      // Hide rest of the page
      document.body.style.overflow = 'hidden';
    }
  }

  /**
   * Remove suspended page overlay
   */
  function removeSuspendedPage() {
    const overlay = document.getElementById('widget-suspended-overlay');
    if (overlay) {
      overlay.remove();
      document.body.style.overflow = '';
    }
  }

  /**
   * Show maintenance page (blocks entire website)
   */
  function showMaintenancePage(customMessage) {
    // Remove instant hide first
    showWebsite();
    
    // Remove existing overlay if any
    removeMaintenancePage();

    const message = customMessage || 'We are currently performing scheduled maintenance. Please check back soon.';

    const maintenanceHTML = `
      <div id="widget-maintenance-overlay" style="
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100vh;
        background: #05020fff;
        z-index: 999999;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        overflow: hidden;
        padding: 10px;
        box-sizing: border-box;
      ">
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;700&display=swap');
          
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          
          @keyframes fallDown {
            0% { transform: translateY(-100vh); opacity: 0; }
            10% { opacity: 0.5; }
            90% { opacity: 0.5; }
            100% { transform: translateY(100vh); opacity: 0; }
          }
          
          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-20px); }
          }
          
          .maintenance-container {
            animation: fadeIn 0.6s ease-out;
          }
          
          .falling-particle {
            position: absolute;
            width: 2px;
            height: 80px;
            background: linear-gradient(to bottom, transparent, rgba(252, 177, 177, 0.3), transparent);
            animation: fallDown linear infinite;
            border-radius: 50%;
          }
          
          .falling-particle:nth-child(1) { left: 5%; animation-duration: 8s; animation-delay: 0s; height: 60px; }
          .falling-particle:nth-child(2) { left: 15%; animation-duration: 10s; animation-delay: 2s; height: 90px; }
          .falling-particle:nth-child(3) { left: 25%; animation-duration: 7s; animation-delay: 1s; height: 70px; }
          .falling-particle:nth-child(4) { left: 35%; animation-duration: 9s; animation-delay: 3s; height: 85px; }
          .falling-particle:nth-child(5) { left: 45%; animation-duration: 11s; animation-delay: 0.5s; height: 75px; }
          .falling-particle:nth-child(6) { left: 55%; animation-duration: 8.5s; animation-delay: 2.5s; height: 65px; }
          .falling-particle:nth-child(7) { left: 65%; animation-duration: 10.5s; animation-delay: 1.5s; height: 95px; }
          .falling-particle:nth-child(8) { left: 75%; animation-duration: 9.5s; animation-delay: 0.8s; height: 80px; }
          .falling-particle:nth-child(9) { left: 85%; animation-duration: 7.5s; animation-delay: 2.2s; height: 70px; }
          .falling-particle:nth-child(10) { left: 95%; animation-duration: 8.8s; animation-delay: 1.8s; height: 88px; }
          .falling-particle:nth-child(11) { left: 10%; animation-duration: 12s; animation-delay: 3.5s; height: 75px; }
          .falling-particle:nth-child(12) { left: 20%; animation-duration: 9.2s; animation-delay: 0.3s; height: 82px; }
          .falling-particle:nth-child(13) { left: 30%; animation-duration: 10.8s; animation-delay: 2.8s; height: 68px; }
          .falling-particle:nth-child(14) { left: 40%; animation-duration: 8.3s; animation-delay: 1.3s; height: 92px; }
          .falling-particle:nth-child(15) { left: 50%; animation-duration: 11.5s; animation-delay: 0.2s; height: 78px; }
          .falling-particle:nth-child(16) { left: 60%; animation-duration: 7.8s; animation-delay: 2.9s; height: 72px; }
          .falling-particle:nth-child(17) { left: 70%; animation-duration: 9.8s; animation-delay: 1.1s; height: 86px; }
          .falling-particle:nth-child(18) { left: 80%; animation-duration: 10.3s; animation-delay: 3.2s; height: 74px; }
          .falling-particle:nth-child(19) { left: 90%; animation-duration: 8.7s; animation-delay: 0.9s; height: 84px; }
          .falling-particle:nth-child(20) { left: 12%; animation-duration: 11.2s; animation-delay: 2.6s; height: 76px; }
        </style>
        
        <!-- Falling Particles Background -->
        <div style="position: absolute; inset: 0; overflow: hidden; pointer-events: none;">
          <div class="falling-particle"></div>
          <div class="falling-particle"></div>
          <div class="falling-particle"></div>
          <div class="falling-particle"></div>
          <div class="falling-particle"></div>
          <div class="falling-particle"></div>
          <div class="falling-particle"></div>
          <div class="falling-particle"></div>
          <div class="falling-particle"></div>
          <div class="falling-particle"></div>
          <div class="falling-particle"></div>
          <div class="falling-particle"></div>
          <div class="falling-particle"></div>
          <div class="falling-particle"></div>
          <div class="falling-particle"></div>
          <div class="falling-particle"></div>
          <div class="falling-particle"></div>
          <div class="falling-particle"></div>
          <div class="falling-particle"></div>
          <div class="falling-particle"></div>
        </div>
        
        <!-- Main Container -->
        <div class="maintenance-container" style="
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          padding: 50px 40px;
          max-width: 600px;
          width: 100%;
          text-align: center;
        ">
          
          <!-- Maintenance Icon -->
          <div style="margin-bottom: 20px;">
            <img src="frontend/public/maintenance.png"alt="Maintenance" style="width: 150px; height: 150px;">
          </div>
          
          <!-- Title -->
          <h1 style="
            font-family: 'Poppins', sans-serif;
            font-size: 36px;
            font-weight: 700;
            color: #fbbf24;
            margin-bottom: 20px;
            text-shadow: 0 0 20px rgba(251, 191, 36, 0.3);
          ">
           Maintenance Mode
          </h1>
          
          <!-- Main Message -->
          <p style="
            font-family: 'Poppins', sans-serif;
            font-size: 18px;
            color: #e0e0e0;
            line-height: 1.8;
            margin: 20px 0;
            font-weight: 300;
          ">
            ${message}
          </p>
          
          <!-- Info Box -->
          <div style="
            backdrop-filter: blur(5px);
            -webkit-backdrop-filter: blur(5px);
            background: rgba(251, 191, 36, 0.1);
            border: 1px solid rgba(251, 191, 36, 0.3);
            color: white;
            padding: 20px;
            border-radius: 12px;
            margin-top: 25px;
            font-size: 15px;
            font-family: 'Poppins', sans-serif;
            font-weight: 400;
          ">
            <p style="margin: 0; opacity: 0.9;">
              Our team is working to improve your experience.<br>
              We'll be back online shortly. Thank you for your patience!
            </p>
          </div>
          
          <!-- Footer -->
          <p style="
            margin-top: 30px;
            color: #888;
            font-size: 14px;
            font-family: 'Poppins', sans-serif;
            font-weight: 300;
          ">
            Need urgent assistance? Contact your website administrator.
          </p>
          
        </div>
      </div>
    `;

    if (!document.getElementById('widget-maintenance-overlay')) {
      document.body.insertAdjacentHTML('afterbegin', maintenanceHTML);
      // Hide rest of the page
      document.body.style.overflow = 'hidden';
    }
  }

  /**
   * Remove maintenance page overlay
   */
  function removeMaintenancePage() {
    const overlay = document.getElementById('widget-maintenance-overlay');
    if (overlay) {
      overlay.remove();
      document.body.style.overflow = '';
    }
  }

  /**
   * Check if payment warning should be shown (10 min cooldown)
   */
  function shouldShowPaymentWarning() {
    try {
      const lastShown = localStorage.getItem('widget_payment_warning_last_shown');
      if (!lastShown) {
        return true; // First time, show it
      }
      
      const lastShownTime = parseInt(lastShown, 10);
      const now = Date.now();
      const tenMinutes = 10 * 60 * 1000; // 10 minutes in milliseconds
      
      return (now - lastShownTime) >= tenMinutes;
    } catch (e) {
      // If localStorage fails, show warning
      return true;
    }
  }

  /**
   * Mark payment warning as shown
   */
  function markPaymentWarningShown() {
    try {
      localStorage.setItem('widget_payment_warning_last_shown', Date.now().toString());
    } catch (e) {
      // LocalStorage might be blocked
    }
  }

  /**
   * Show payment warning banner
   */
  function showPaymentWarning(amount, dueDate, paymentUrl) {
    // Check if we should show the warning (10 min cooldown)
    if (!shouldShowPaymentWarning()) {
      return; // Don't show, cooldown period not over
    }
    
    // Remove existing banner if any
    removePaymentWarning();

    const dueDateText = dueDate ? new Date(dueDate).toLocaleDateString() : 'soon';

    const bannerHTML = `
      <div id="widget-payment-warning" style="
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        background: linear-gradient(90deg, #f59e0b 0%, #ef4444 100%);
        color: white;
        padding: 15px 20px;
        z-index: 999998;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        animation: slideDown 0.3s ease-out;
      ">
        <style>
          @keyframes slideDown {
            from { transform: translateY(-100%); }
            to { transform: translateY(0); }
          }
        </style>
        <div style="
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 15px;
        ">
          <div style="display: flex; align-items: center; gap: 15px;">
            <span style="font-size: 24px;">⚠️</span>
            <div>
              <strong style="font-size: 16px; display: block; margin-bottom: 4px;">
                Payment Due: Rs. ${amount || 'N/A'}
              </strong>
              <span style="font-size: 14px; opacity: 0.95;">
                Due date: ${dueDateText} • Your website will be suspended if payment is not received.
              </span>
            </div>
          </div>
          
          <div style="display: flex; gap: 10px; align-items: center;">
            ${paymentUrl ? `
              <a href="${paymentUrl}" style="
                background: white;
                color: #ef4444;
                padding: 10px 24px;
                border-radius: 8px;
                text-decoration: none;
                font-weight: 600;
                font-size: 14px;
                transition: transform 0.2s;
                box-shadow: 0 2px 8px rgba(0,0,0,0.2);
              " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
                Pay Now
              </a>
            ` : ''}
            <button onclick="
              document.getElementById('widget-payment-warning').remove();
              document.body.style.marginTop = '';
            " style="
              background: transparent;
              border: 2px solid white;
              color: white;
              padding: 8px 16px;
              border-radius: 8px;
              cursor: pointer;
              font-weight: 600;
              font-size: 14px;
              transition: all 0.2s;
            " onmouseover="this.style.background='rgba(255,255,255,0.2)'" onmouseout="this.style.background='transparent'">
              Dismiss
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('afterbegin', bannerHTML);
    warningBanner = document.getElementById('widget-payment-warning');
    
    // Mark as shown (start 10 min cooldown)
    markPaymentWarningShown();

    // Push content down
    if (document.body.style.marginTop === '') {
      document.body.style.marginTop = '80px';
    }
  }

  /**
   * Remove payment warning banner
   */
  function removePaymentWarning() {
    if (warningBanner) {
      warningBanner.remove();
      warningBanner = null;
      document.body.style.marginTop = '';
    }
  }

  /**
   * Get human-readable reason text
   */
  function getReasonText(reason) {
    const reasons = {
      'payment_overdue': 'Payment overdue - Please make payment to reactivate',
      'manual': 'Automatic suspended by System',
      'violation': 'Terms of service violation',
      'maintenance': 'Under maintenance'
    };
    return reasons[reason] || reason;
  }

  /**
   * Initialize widget
   */
  function init() {
    // If we have cached status showing suspended/maintenance, use it immediately
    if (cachedStatus) {
      if (cachedStatus.maintenanceMode) {
        showMaintenancePage(cachedStatus.maintenanceMessage);
      } else if (cachedStatus.status === 'suspended') {
        showSuspendedPage(cachedStatus.reason, cachedStatus.message, null);
      } else {
        // Active - will be handled by API check
      }
    }
    
    // First check immediately (to update cache)
    checkStatus();
    
    // Then check every 20 seconds
    setInterval(checkStatus, CONFIG.CHECK_INTERVAL);
  }

  // Start widget when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose public test helpers so demo pages can trigger the UI manually
  try {
    window.SiteWidget = window.SiteWidget || {};
    window.SiteWidget.test = {
      // Show the payment warning banner (amount in rupees, dueDate ISO string or Date, paymentUrl)
      showPaymentWarning: function(amount, dueDate, paymentUrl) {
        try {
          showPaymentWarning(amount, dueDate, paymentUrl);
        } catch (e) {
          // Silently fail
        }
      },
      // Show suspended page (reason, message, optional paymentUrl)
      showSuspendedPage: function(reason, message, paymentUrl) {
        try {
          showSuspendedPage(reason, message, paymentUrl);
        } catch (e) {
          // Silently fail
        }
      },
      // Remove suspended overlay if present
      clearSuspended: function() {
        try {
          const o = document.getElementById('widget-suspended-overlay');
          if (o) {
            o.remove();
            document.body.style.overflow = '';
          }
        } catch (e) {
          // Silently fail
        }
      },
      // Remove payment warning banner if present
      clearPaymentWarning: function() {
        try {
          removePaymentWarning();
        } catch (e) {
          // Silently fail
        }
      },
      // Simulate a full status object as returned by the API
      simulateStatus: function(statusObj) {
        try {
          handleStatusUpdate(statusObj);
        } catch (e) {
          // Silently fail
        }
      }
    };
  } catch (e) {
    // Silently ignore if window is not writable in exotic environments
  }

})();
