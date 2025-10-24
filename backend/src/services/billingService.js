const { Site, Payment, Customer } = require('../models');
const emailService = require('./emailService');

/**
 * Billing Service
 * Handles payment reminders and automatic suspensions
 */
class BillingService {
  /**
   * Check all payments and send reminders
   * This should run daily via cron job
   */
  async processDailyBillingChecks() {
    try {
      console.log('Starting daily billing checks...');

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Get all pending and overdue payments
      const payments = await Payment.find({
        status: { $in: ['pending', 'overdue'] }
      }).populate('site_id').populate('customer_id');

      let remindersSent = 0;
      let suspensionsProcessed = 0;

      for (const payment of payments) {
        if (!payment.site_id || !payment.customer_id) continue;

        const site = payment.site_id;
        const customer = payment.customer_id;
        const dueDate = new Date(payment.dueDate);
        dueDate.setHours(0, 0, 0, 0);

        const daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
        const daysOverdue = Math.abs(daysUntilDue);

        // 10 days before due date - send reminder
        if (daysUntilDue === 10 && !payment.wasReminderSent('10_days_before')) {
          await emailService.sendPaymentReminder(customer, site, payment, 10);
          await payment.markReminderSent('10_days_before');
          remindersSent++;
          console.log(`Sent 10-day reminder for ${site.domain}`);
        }

        // On due date - send warning
        if (daysUntilDue === 0 && !payment.wasReminderSent('due_date')) {
          await emailService.sendPaymentDueNotification(customer, site, payment);
          await payment.markReminderSent('due_date');
          payment.status = 'overdue';
          await payment.save();
          remindersSent++;
          console.log(`Sent due date warning for ${site.domain}`);
        }

        // Check if payment is overdue
        if (daysUntilDue < 0) {
          payment.status = 'overdue';
          await payment.save();

          const gracePeriodDays = parseInt(process.env.GRACE_PERIOD_DAYS) || 10;
          const daysRemainingInGrace = gracePeriodDays - daysOverdue;

          // Grace period active - send progressive warnings
          if (daysOverdue < gracePeriodDays) {
            // Send warnings at specific milestones during grace period
            const warningDays = [1, 3, 5, 7]; // Days after due date to send warnings
            
            if (warningDays.includes(daysOverdue) && !payment.wasReminderSent(`overdue_day_${daysOverdue}`)) {
              await emailService.sendOverdueWarning(customer, site, payment, daysOverdue);
              await payment.markReminderSent(`overdue_day_${daysOverdue}`);
              remindersSent++;
              console.log(`📧 Sent overdue warning for ${site.domain} (${daysOverdue}/${gracePeriodDays} grace days used, ${daysRemainingInGrace} days remaining)`);
            }

            // Final warning: 1 day before suspension
            if (daysOverdue === gracePeriodDays - 1 && !payment.wasReminderSent('final_warning')) {
              await emailService.sendFinalWarning(customer, site, payment);
              await payment.markReminderSent('final_warning');
              remindersSent++;
              console.log(`⚠️  FINAL WARNING sent for ${site.domain} - Will suspend tomorrow if payment not received!`);
            }
          }

          // Grace period EXPIRED - Auto-suspend
          if (daysOverdue >= gracePeriodDays && site.status === 'active') {
            // Mark grace period as expired
            if (!site.gracePeriodExpired) {
              site.gracePeriodExpired = true;
              site.gracePeriodExpiredAt = new Date();
            }

            // Suspend the site
            await this.suspendSite(site._id, 'payment_overdue');
            await emailService.sendSuspensionNotification(customer, site);
            suspensionsProcessed++;
            
            console.log(`🚫 AUTO-SUSPENDED: ${site.domain}`);
            console.log(`   ├─ Days overdue: ${daysOverdue}`);
            console.log(`   ├─ Grace period: ${gracePeriodDays} days`);
            console.log(`   ├─ Payment amount: ₹${payment.amount}`);
            console.log(`   └─ Suspension reason: payment_overdue`);
          }

          // Already suspended - log status
          if (site.status === 'suspended' && daysOverdue >= gracePeriodDays) {
            console.log(`⏸️  Site already suspended: ${site.domain} (${daysOverdue} days overdue)`);
          }
        }
      }

      console.log(`Billing checks complete: ${remindersSent} reminders sent, ${suspensionsProcessed} sites suspended`);
      
      return {
        remindersSent,
        suspensionsProcessed
      };

    } catch (error) {
      console.error('Error in daily billing checks:', error.message);
      throw error;
    }
  }

  /**
   * Suspend a site
   * @param {String} siteId - Site ID
   * @param {String} reason - Suspension reason
   * @param {String} adminId - Admin ID (optional, for manual suspension)
   */
  async suspendSite(siteId, reason = 'payment_overdue', adminId = null) {
    try {
      const site = await Site.findById(siteId);
      if (!site) {
        throw new Error('Site not found');
      }

      site.status = 'suspended';
      site.suspensionReason = reason;
      site.suspendedAt = new Date();
      if (adminId) {
        site.suspendedBy = adminId;
      }

      await site.save();
      
      console.log(`Site suspended: ${site.domain}`);
      return site;

    } catch (error) {
      console.error('Error suspending site:', error.message);
      throw error;
    }
  }

  /**
   * Reactivate a suspended site
   * @param {String} siteId - Site ID
   */
  async reactivateSite(siteId) {
    try {
      const site = await Site.findById(siteId);
      if (!site) {
        throw new Error('Site not found');
      }

      site.status = 'active';
      site.suspensionReason = 'none';
      site.suspendedAt = null;
      site.suspendedBy = null;

      await site.save();

      console.log(`Site reactivated: ${site.domain}`);
      return site;

    } catch (error) {
      console.error('Error reactivating site:', error.message);
      throw error;
    }
  }

  /**
   * Create next payment invoice for a site
   * @param {String} siteId - Site ID
   */
  async createNextPayment(siteId) {
    try {
      const site = await Site.findById(siteId).populate('customer_id');
      if (!site) {
        throw new Error('Site not found');
      }

      const periodStart = new Date(site.nextPaymentDate);
      const periodEnd = new Date(periodStart);
      periodEnd.setMonth(periodEnd.getMonth() + site.paymentCycleMonths);

      const payment = await Payment.create({
        site_id: site._id,
        customer_id: site.customer_id._id,
        amount: site.paymentAmount,
        dueDate: site.nextPaymentDate,
        periodStart,
        periodEnd,
        status: 'pending'
      });

      console.log(`Created payment invoice ${payment.invoiceNumber} for ${site.domain}`);
      return payment;

    } catch (error) {
      console.error('Error creating payment:', error.message);
      throw error;
    }
  }

  /**
   * Mark payment as paid and reactivate site
   * @param {String} paymentId - Payment ID
   * @param {String} adminId - Admin ID who verified
   * @param {String} notes - Verification notes
   */
  async markPaymentAsPaid(paymentId, adminId, notes = '') {
    try {
      const billService = require('./billService');
      
      const payment = await Payment.findById(paymentId).populate('site_id').populate('customer_id');
      if (!payment) {
        throw new Error('Payment not found');
      }

      payment.status = 'paid';
      payment.paidDate = new Date();
      payment.verifiedBy = adminId;
      payment.verifiedAt = new Date();
      payment.verificationNotes = notes;

      // Generate bill/invoice PDF
      let billFilePath = null;
      try {
        const path = require('path');
        const billFilename = await billService.generateBill(payment);
        payment.billUrl = billService.getBillUrl(billFilename);
        payment.billGeneratedAt = new Date();
        billFilePath = path.join(__dirname, '../../public/bills', billFilename);
        console.log(`✓ Bill generated: ${billFilename}`);
      } catch (billError) {
        console.error('Error generating bill:', billError.message);
        // Don't fail the payment verification if bill generation fails
      }

      await payment.save();

      // Send payment receipt email with bill PDF to customer
      if (billFilePath) {
        try {
          await emailService.sendPaymentReceiptWithBill(
            payment.customer_id,
            payment.site_id,
            payment,
            billFilePath
          );
          console.log(`✓ Payment receipt email sent to ${payment.customer_id.email}`);
        } catch (emailError) {
          console.error('Error sending payment receipt email:', emailError.message);
          // Don't fail the payment verification if email fails
        }
      }

      // Update site's next payment date
      const site = payment.site_id;
      const newNextPaymentDate = new Date(payment.dueDate);
      newNextPaymentDate.setMonth(newNextPaymentDate.getMonth() + site.paymentCycleMonths);
      
      site.nextPaymentDate = newNextPaymentDate;
      site.lastPaymentDate = new Date();
      
      // Check if there are any other overdue/pending payments for this site
      const otherOverduePayments = await Payment.countDocuments({
        site_id: site._id,
        _id: { $ne: paymentId },
        status: { $in: ['pending', 'overdue', 'proof_uploaded'] }
      });

      // Reactivate site if it was suspended/inactive and no other pending payments
      if (otherOverduePayments === 0) {
        const wasInactive = (site.status === 'suspended' || site.status === 'inactive' || site.suspensionReason === 'payment_overdue');
        
        if (wasInactive) {
          // Reactivate the site
          site.status = 'active';
          site.suspensionReason = 'none';
          site.suspendedAt = null;
          site.suspendedBy = null;
          
          console.log(`✓ Site reactivated: ${site.domain}`);
          
          // Send reactivation email
          await emailService.sendReactivationNotification(payment.customer_id, site);
        }
      }
      
      await site.save();

      console.log(`Payment ${payment.invoiceNumber} marked as paid for ${site.domain}`);
      return payment;

    } catch (error) {
      console.error('Error marking payment as paid:', error.message);
      throw error;
    }
  }

  /**
   * Get billing statistics
   */
  async getBillingStats() {
    try {
      const today = new Date();
      const thirtyDaysFromNow = new Date(today);
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

      const [
        pendingPayments,
        overduePayments,
        upcomingPayments,
        monthlyRevenue
      ] = await Promise.all([
        Payment.countDocuments({ status: 'pending' }),
        Payment.countDocuments({ status: 'overdue' }),
        Payment.countDocuments({
          status: 'pending',
          dueDate: { $gte: today, $lte: thirtyDaysFromNow }
        }),
        Payment.aggregate([
          {
            $match: {
              status: 'paid',
              paidDate: {
                $gte: new Date(today.getFullYear(), today.getMonth(), 1),
                $lt: new Date(today.getFullYear(), today.getMonth() + 1, 1)
              }
            }
          },
          {
            $group: {
              _id: null,
              total: { $sum: '$amount' }
            }
          }
        ])
      ]);

      return {
        pendingPayments,
        overduePayments,
        upcomingPayments,
        monthlyRevenue: monthlyRevenue[0]?.total || 0
      };

    } catch (error) {
      console.error('Error getting billing stats:', error.message);
      throw error;
    }
  }
}

// Export singleton instance
module.exports = new BillingService();
