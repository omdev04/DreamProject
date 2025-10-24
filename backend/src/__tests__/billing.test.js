const billingService = require('../../services/billingService');
const { Site, Payment, Customer } = require('../../models');

// Mock dependencies
jest.mock('../../services/emailService');

describe('Billing Service', () => {
  describe('suspendSite', () => {
    it('should suspend a site with payment_overdue reason', async () => {
      const mockSite = {
        _id: 'site123',
        domain: 'test.com',
        status: 'active',
        save: jest.fn().mockResolvedValue(true)
      };

      Site.findById = jest.fn().mockResolvedValue(mockSite);

      await billingService.suspendSite('site123', 'payment_overdue');

      expect(mockSite.status).toBe('suspended');
      expect(mockSite.suspensionReason).toBe('payment_overdue');
      expect(mockSite.suspendedAt).toBeDefined();
      expect(mockSite.save).toHaveBeenCalled();
    });

    it('should throw error if site not found', async () => {
      Site.findById = jest.fn().mockResolvedValue(null);

      await expect(
        billingService.suspendSite('invalid_id', 'payment_overdue')
      ).rejects.toThrow('Site not found');
    });
  });

  describe('reactivateSite', () => {
    it('should reactivate a suspended site', async () => {
      const mockSite = {
        _id: 'site123',
        domain: 'test.com',
        status: 'suspended',
        suspensionReason: 'payment_overdue',
        save: jest.fn().mockResolvedValue(true)
      };

      Site.findById = jest.fn().mockResolvedValue(mockSite);

      await billingService.reactivateSite('site123');

      expect(mockSite.status).toBe('active');
      expect(mockSite.suspensionReason).toBe('none');
      expect(mockSite.suspendedAt).toBeNull();
      expect(mockSite.save).toHaveBeenCalled();
    });
  });

  describe('markPaymentAsPaid', () => {
    it('should mark payment as paid and update site', async () => {
      const mockPayment = {
        _id: 'payment123',
        status: 'pending',
        dueDate: new Date('2024-01-01'),
        site_id: {
          _id: 'site123',
          paymentCycleMonths: 3,
          nextPaymentDate: new Date('2024-01-01'),
          status: 'suspended',
          suspensionReason: 'payment_overdue',
          save: jest.fn().mockResolvedValue(true)
        },
        customer_id: { _id: 'customer123' },
        save: jest.fn().mockResolvedValue(true)
      };

      Payment.findById = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(mockPayment)
        })
      });

      Site.findById = jest.fn().mockResolvedValue(mockPayment.site_id);

      const result = await billingService.markPaymentAsPaid(
        'payment123',
        'admin123',
        'Verified'
      );

      expect(mockPayment.status).toBe('paid');
      expect(mockPayment.verifiedBy).toBe('admin123');
      expect(mockPayment.verificationNotes).toBe('Verified');
      expect(mockPayment.paidDate).toBeDefined();
      expect(mockPayment.save).toHaveBeenCalled();
    });
  });
});

describe('Site Model Methods', () => {
  describe('isPaymentOverdue', () => {
    it('should return true if payment date has passed', () => {
      const site = {
        nextPaymentDate: new Date('2020-01-01'),
        status: 'active',
        isPaymentOverdue: function() {
          return new Date() > this.nextPaymentDate && this.status !== 'suspended';
        }
      };

      expect(site.isPaymentOverdue()).toBe(true);
    });

    it('should return false if site is already suspended', () => {
      const site = {
        nextPaymentDate: new Date('2020-01-01'),
        status: 'suspended',
        isPaymentOverdue: function() {
          return new Date() > this.nextPaymentDate && this.status !== 'suspended';
        }
      };

      expect(site.isPaymentOverdue()).toBe(false);
    });

    it('should return false if payment date has not passed', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);

      const site = {
        nextPaymentDate: futureDate,
        status: 'active',
        isPaymentOverdue: function() {
          return new Date() > this.nextPaymentDate && this.status !== 'suspended';
        }
      };

      expect(site.isPaymentOverdue()).toBe(false);
    });
  });

  describe('isGracePeriodExpired', () => {
    it('should return true if grace period has expired', () => {
      process.env.GRACE_PERIOD_DAYS = '10';
      
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 15);

      const site = {
        nextPaymentDate: pastDate,
        getGracePeriodEndDate: function() {
          const graceDays = parseInt(process.env.GRACE_PERIOD_DAYS) || 10;
          const endDate = new Date(this.nextPaymentDate);
          endDate.setDate(endDate.getDate() + graceDays);
          return endDate;
        },
        isGracePeriodExpired: function() {
          return new Date() > this.getGracePeriodEndDate();
        }
      };

      expect(site.isGracePeriodExpired()).toBe(true);
    });

    it('should return false if grace period has not expired', () => {
      process.env.GRACE_PERIOD_DAYS = '10';
      
      const recentDate = new Date();
      recentDate.setDate(recentDate.getDate() - 5);

      const site = {
        nextPaymentDate: recentDate,
        getGracePeriodEndDate: function() {
          const graceDays = parseInt(process.env.GRACE_PERIOD_DAYS) || 10;
          const endDate = new Date(this.nextPaymentDate);
          endDate.setDate(endDate.getDate() + graceDays);
          return endDate;
        },
        isGracePeriodExpired: function() {
          return new Date() > this.getGracePeriodEndDate();
        }
      };

      expect(site.isGracePeriodExpired()).toBe(false);
    });
  });
});

describe('Payment Model Methods', () => {
  describe('isOverdue', () => {
    it('should return true for pending payment past due date', () => {
      const payment = {
        status: 'pending',
        dueDate: new Date('2020-01-01'),
        isOverdue: function() {
          return this.status === 'pending' && new Date() > this.dueDate;
        }
      };

      expect(payment.isOverdue()).toBe(true);
    });

    it('should return false for paid payment', () => {
      const payment = {
        status: 'paid',
        dueDate: new Date('2020-01-01'),
        isOverdue: function() {
          return this.status === 'pending' && new Date() > this.dueDate;
        }
      };

      expect(payment.isOverdue()).toBe(false);
    });
  });

  describe('wasReminderSent', () => {
    it('should return true if reminder type exists', () => {
      const payment = {
        remindersSent: [
          { type: '10_days_before', sentAt: new Date() }
        ],
        wasReminderSent: function(reminderType) {
          return this.remindersSent.some(r => r.type === reminderType);
        }
      };

      expect(payment.wasReminderSent('10_days_before')).toBe(true);
    });

    it('should return false if reminder type does not exist', () => {
      const payment = {
        remindersSent: [],
        wasReminderSent: function(reminderType) {
          return this.remindersSent.some(r => r.type === reminderType);
        }
      };

      expect(payment.wasReminderSent('10_days_before')).toBe(false);
    });
  });
});
