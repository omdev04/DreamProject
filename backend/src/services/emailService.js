const nodemailer = require('nodemailer');

/**
 * Email Service
 * Handles all email notifications using Nodemailer
 */
class EmailService {
  constructor() {
    this.transporter = null;
    this.initialize();
  }

  /**
   * Initialize email transporter
   */
  initialize() {
    try {
      // Remove spaces from password if any
      const smtpPass = process.env.SMTP_PASS ? process.env.SMTP_PASS.replace(/\s/g, '') : '';
      
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: smtpPass
        },
        tls: {
          rejectUnauthorized: false
        }
      });
      
      // Verify connection
      this.transporter.verify((error, success) => {
        if (error) {
          console.error('❌ Email service connection failed:', error.message);
        } else {
          console.log('✓ Email service initialized and verified');
          console.log(`  SMTP Host: ${process.env.SMTP_HOST}`);
          console.log(`  SMTP User: ${process.env.SMTP_USER}`);
        }
      });
      
    } catch (error) {
      console.error('❌ Failed to initialize email service:', error.message);
    }
  }

  /**
   * Send email
   * @param {Object} options - Email options
   */
  async sendEmail({ to, subject, html, text }) {
    try {
      if (!this.transporter) {
        console.error('Email transporter not initialized');
        return false;
      }

      const mailOptions = {
        from: `${process.env.COMPANY_NAME} <${process.env.EMAIL_FROM}>`,
        to,
        subject,
        html,
        text: text || html.replace(/<[^>]*>/g, '') // Strip HTML for text version
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('Email sent:', info.messageId);
      return true;
    } catch (error) {
      console.error('Failed to send email:', error.message);
      return false;
    }
  }

  /**
   * Send welcome email to new customer
   */
  async sendWelcomeEmail(customer) {
    const subject = `Welcome to ${process.env.COMPANY_NAME || 'Panaglo'}!`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
        <!-- Header with Panaglo Branding -->
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 32px; font-weight: bold; text-shadow: 2px 2px 4px rgba(0,0,0,0.2);">
            ${process.env.COMPANY_NAME || 'Panaglo'}
          </h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 14px;">Website Management & Monitoring</p>
        </div>
        
        <div style="padding: 30px;">
          <h2 style="color: #333; margin-top: 0;">Welcome Aboard! 🎉</h2>
          <p style="color: #555; line-height: 1.6;">Dear ${customer.name},</p>
          <p style="color: #555; line-height: 1.6;">Thank you for choosing <strong>${process.env.COMPANY_NAME || 'Panaglo'}</strong> for your website management needs!</p>
        
        <div style="background: #e3f2fd; padding: 15px; margin: 20px 0; border-radius: 5px;">
          <h3 style="margin-top: 0;">Your Account Details</h3>
          <p><strong>Name:</strong> ${customer.name}</p>
          <p><strong>Email:</strong> ${customer.email}</p>
          <p><strong>Phone:</strong> ${customer.phone}</p>
          ${customer.company ? `<p><strong>Company:</strong> ${customer.company}</p>` : ''}
        </div>
        
        ${customer.password ? `
        <div style="background: #fff3cd; border: 2px solid #ffc107; padding: 20px; margin: 20px 0; border-radius: 8px; text-align: center;">
          <h3 style="margin-top: 0; color: #856404;">🔐 Your Login Credentials</h3>
          <p style="margin: 10px 0;"><strong>Email:</strong> ${customer.email}</p>
          <p style="margin: 10px 0;"><strong>Password:</strong> 
            <span style="font-family: 'Courier New', monospace; font-size: 18px; color: #d63333; background: white; padding: 8px 15px; border-radius: 5px; display: inline-block; margin-top: 5px; border: 1px solid #ddd;">
              ${customer.password}
            </span>
          </p>
          <p style="font-size: 12px; color: #856404; margin-top: 15px;">⚠️ Please save this password securely. You won't be able to see it again.</p>
        </div>
        
        <div style="text-align: center; margin: 25px 0;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/login" 
             style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);">
            Login to Dashboard →
          </a>
        </div>
        ` : ''}
        
        <p>Your account has been successfully created. You can now log in to your dashboard using the credentials above.</p>
        
        <div style="background: #d4edda; padding: 15px; margin: 20px 0; border-radius: 5px;">
          <h3 style="margin-top: 0;">What's Next?</h3>
          <ul style="margin: 10px 0; padding-left: 20px;">
            <li>We'll set up your website(s)</li>
            <li>You'll receive monitoring and uptime alerts</li>
            <li>Automated billing and payment reminders</li>
            <li>24/7 support from our team</li>
          </ul>
        </div>
        
        <p style="color: #555; line-height: 1.6;">If you have any questions, feel free to reach out to us:</p>
        <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 5px 0; color: #555;">📧 <strong>Email:</strong> ${process.env.COMPANY_EMAIL || 'support@panaglo.com'}</p>
          <p style="margin: 5px 0; color: #555;">📞 <strong>Phone:</strong> ${process.env.COMPANY_PHONE || '+91-9876543210'}</p>
          ${process.env.COMPANY_WEBSITE ? `<p style="margin: 5px 0; color: #555;">🌐 <strong>Website:</strong> ${process.env.COMPANY_WEBSITE}</p>` : ''}
        </div>
        
        <p style="margin-top: 30px; color: #555;">Best regards,<br><strong>${process.env.COMPANY_NAME || 'Panaglo'} Team</strong></p>
        </div>
        
        <!-- Footer -->
        <div style="background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; border-top: 3px solid #667eea;">
          <p style="margin: 0; color: #666; font-size: 12px;">© ${new Date().getFullYear()} ${process.env.COMPANY_NAME || 'Panaglo'}. All rights reserved.</p>
          <p style="margin: 5px 0 0 0; color: #999; font-size: 11px;">This is an automated email. Please do not reply.</p>
        </div>
      </div>
    `;

    return await this.sendEmail({
      to: customer.email,
      subject,
      html
    });
  }

  /**
   * Send payment reminder email
   */
  async sendPaymentReminder(customer, site, payment, daysUntilDue) {
    const subject = `⏰ Payment Reminder - ${site.domain} | ${process.env.COMPANY_NAME || 'Panaglo'}`;
    const html = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold; text-shadow: 0 2px 10px rgba(0,0,0,0.2);">
            ${process.env.COMPANY_NAME || 'Panaglo'}
          </h1>
          <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 14px;">
            Website Management & Monitoring Platform
          </p>
        </div>
        
        <!-- Content -->
        <div style="padding: 35px; background: white;">
        <div style="text-align: center; margin-bottom: 25px;">
          <div style="display: inline-block; background: #fff3cd; color: #856404; padding: 12px 25px; border-radius: 25px; font-weight: bold;">
            ⏰ Payment Due in ${daysUntilDue} Days
          </div>
        </div>
        
        <p style="font-size: 16px; color: #333;">Dear <strong>${customer.name}</strong>,</p>
        <p style="color: #555; line-height: 1.6;">This is a friendly reminder that your payment for <strong style="color: #667eea;">${site.domain}</strong> is due soon.</p>
        
        <div style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); padding: 20px; margin: 25px 0; border-radius: 8px; border-left: 4px solid #667eea;">
          <h3 style="margin-top: 0; color: #667eea; font-size: 18px;">📋 Payment Details</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #666; font-weight: 600;">Invoice Number:</td>
              <td style="padding: 8px 0; color: #333; text-align: right; font-family: 'Courier New', monospace;">${payment.invoiceNumber}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666; font-weight: 600;">Amount Due:</td>
              <td style="padding: 8px 0; color: #d63333; text-align: right; font-weight: bold; font-size: 18px;">Rs. ${payment.amount.toLocaleString('en-IN')}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666; font-weight: 600;">Due Date:</td>
              <td style="padding: 8px 0; color: #333; text-align: right; font-weight: bold;">${new Date(payment.dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666; font-weight: 600;">Service Period:</td>
              <td style="padding: 8px 0; color: #333; text-align: right; font-size: 13px;">${new Date(payment.periodStart).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} - ${new Date(payment.periodEnd).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
            </tr>
          </table>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/payments" 
             style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);">
            Make Payment Now →
          </a>
        </div>
        
        <div style="background: #d4edda; border-left: 4px solid #28a745; padding: 15px; margin: 20px 0; border-radius: 5px;">
          <p style="margin: 0; color: #155724; font-weight: 600;">💡 Quick Tip</p>
          <p style="margin: 10px 0 0 0; color: #155724;">Log in to your dashboard to upload payment proof and track all your payments in one place.</p>
        </div>
        
        <p style="color: #555; line-height: 1.6; margin-top: 25px;">Please ensure timely payment to avoid any service interruptions.</p>
        
        <p style="color: #555; line-height: 1.6;">If you have any questions, feel free to reach out to us:</p>
        <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 5px 0; color: #555;">📧 <strong>Email:</strong> ${process.env.COMPANY_EMAIL || 'support@panaglo.com'}</p>
          <p style="margin: 5px 0; color: #555;">📞 <strong>Phone:</strong> ${process.env.COMPANY_PHONE || '+91-9876543210'}</p>
          ${process.env.COMPANY_WEBSITE ? `<p style="margin: 5px 0; color: #555;">🌐 <strong>Website:</strong> ${process.env.COMPANY_WEBSITE}</p>` : ''}
        </div>
        
        <p style="margin-top: 30px; color: #555;">Best regards,<br><strong>${process.env.COMPANY_NAME || 'Panaglo'} Team</strong></p>
        </div>
        
        <!-- Footer -->
        <div style="background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; border-top: 3px solid #667eea;">
          <p style="margin: 0; color: #666; font-size: 12px;">© ${new Date().getFullYear()} ${process.env.COMPANY_NAME || 'Panaglo'}. All rights reserved.</p>
          <p style="margin: 5px 0 0 0; color: #999; font-size: 11px;">This is an automated email. Please do not reply.</p>
        </div>
      </div>
    `;

    return await this.sendEmail({
      to: customer.email,
      subject,
      html
    });
  }

  /**
   * Send payment due notification
   */
  async sendPaymentDueNotification(customer, site, payment) {
    const subject = `🔴 Payment Due TODAY - ${site.domain} | ${process.env.COMPANY_NAME || 'Panaglo'}`;
    const html = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #dc3545 0%, #c82333 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold; text-shadow: 0 2px 10px rgba(0,0,0,0.2);">
            ${process.env.COMPANY_NAME || 'Panaglo'}
          </h1>
          <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 14px;">
            Website Management & Monitoring Platform
          </p>
        </div>
        
        <!-- Content -->
        <div style="padding: 35px; background: white;">
        <div style="text-align: center; margin-bottom: 25px;">
          <div style="display: inline-block; background: #dc3545; color: white; padding: 12px 25px; border-radius: 25px; font-weight: bold; font-size: 16px;">
            🔴 PAYMENT DUE TODAY
          </div>
        </div>
        
        <p style="font-size: 16px; color: #333;">Dear <strong>${customer.name}</strong>,</p>
        <p style="color: #555; line-height: 1.6;">Your payment for <strong style="color: #dc3545;">${site.domain}</strong> is <strong>due today</strong>.</p>
        
        <div style="background: linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%); padding: 20px; margin: 25px 0; border-radius: 8px; border-left: 4px solid #ffc107;">
          <h3 style="margin-top: 0; color: #856404; font-size: 18px;">📋 Payment Details</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #666; font-weight: 600;">Invoice Number:</td>
              <td style="padding: 8px 0; color: #333; text-align: right; font-family: 'Courier New', monospace;">${payment.invoiceNumber}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666; font-weight: 600;">Amount Due:</td>
              <td style="padding: 8px 0; color: #dc3545; text-align: right; font-weight: bold; font-size: 20px;">Rs. ${payment.amount.toLocaleString('en-IN')}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666; font-weight: 600;">Due Date:</td>
              <td style="padding: 8px 0; color: #dc3545; text-align: right; font-weight: bold;">${new Date(payment.dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} (TODAY)</td>
            </tr>
          </table>
        </div>
        
        <div style="background: #f8d7da; border-left: 4px solid #dc3545; padding: 15px; margin: 20px 0; border-radius: 5px;">
          <p style="margin: 0; color: #721c24; font-weight: 600;">⚠️ Important Notice</p>
          <p style="margin: 10px 0 0 0; color: #721c24;">Failure to pay within <strong>${process.env.GRACE_PERIOD_DAYS || '10'} days</strong> will result in automatic suspension of your website services.</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/payments" 
             style="display: inline-block; background: linear-gradient(135deg, #dc3545 0%, #c82333 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 15px rgba(220, 53, 69, 0.4);">
            Pay Immediately →
          </a>
        </div>
        
        <p style="color: #555; line-height: 1.6; margin-top: 25px;">Please make your payment immediately to avoid any service interruptions.</p>
        
        <p style="color: #555; line-height: 1.6;">If you have any questions, feel free to reach out to us:</p>
        <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 5px 0; color: #555;">📧 <strong>Email:</strong> ${process.env.COMPANY_EMAIL || 'support@panaglo.com'}</p>
          <p style="margin: 5px 0; color: #555;">📞 <strong>Phone:</strong> ${process.env.COMPANY_PHONE || '+91-9876543210'}</p>
          ${process.env.COMPANY_WEBSITE ? `<p style="margin: 5px 0; color: #555;">🌐 <strong>Website:</strong> ${process.env.COMPANY_WEBSITE}</p>` : ''}
        </div>
        
        <p style="margin-top: 30px; color: #555;">Best regards,<br><strong>${process.env.COMPANY_NAME || 'Panaglo'} Team</strong></p>
        </div>
        
        <!-- Footer -->
        <div style="background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; border-top: 3px solid #dc3545;">
          <p style="margin: 0; color: #666; font-size: 12px;">© ${new Date().getFullYear()} ${process.env.COMPANY_NAME || 'Panaglo'}. All rights reserved.</p>
          <p style="margin: 5px 0 0 0; color: #999; font-size: 11px;">This is an automated email. Please do not reply.</p>
        </div>
      </div>
    `;

    return await this.sendEmail({
      to: customer.email,
      subject,
      html
    });
  }

  /**
   * Send overdue payment warning
   */
  async sendOverdueWarning(customer, site, payment, daysOverdue) {
    const gracePeriodDays = parseInt(process.env.GRACE_PERIOD_DAYS) || 10;
    const daysRemaining = gracePeriodDays - daysOverdue;
    
    const subject = `⚠️ URGENT: Payment ${daysOverdue} Days Overdue - ${site.domain} | ${process.env.COMPANY_NAME || 'Panaglo'}`;
    const html = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #c0392b 0%, #8e1e1e 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold; text-shadow: 0 2px 10px rgba(0,0,0,0.2);">
            ${process.env.COMPANY_NAME || 'Panaglo'}
          </h1>
          <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 14px;">
            Website Management & Monitoring Platform
          </p>
        </div>
        
        <!-- Content -->
        <div style="padding: 35px; background: white;">
        <div style="text-align: center; margin-bottom: 25px;">
          <div style="display: inline-block; background: #c0392b; color: white; padding: 12px 25px; border-radius: 25px; font-weight: bold; font-size: 16px;">
            ⚠️ URGENT: PAYMENT OVERDUE
          </div>
        </div>
        
        <p style="font-size: 16px; color: #333;">Dear <strong>${customer.name}</strong>,</p>
        <p style="color: #555; line-height: 1.6;">Your payment for <strong style="color: #c0392b;">${site.domain}</strong> is now <strong style="color: #dc3545; font-size: 18px;">${daysOverdue} days overdue</strong>.</p>
        
        <div style="background: ${daysRemaining <= 2 ? 'linear-gradient(135deg, #f8d7da 0%, #f5c2c7 100%)' : 'linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%)'}; padding: 20px; margin: 25px 0; border-radius: 8px; border-left: 4px solid ${daysRemaining <= 2 ? '#dc3545' : '#ffc107'};">
          <h3 style="margin-top: 0; color: ${daysRemaining <= 2 ? '#721c24' : '#856404'}; font-size: 18px;">⏳ Grace Period Status</h3>
          <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
            <tr>
              <td style="padding: 8px 0; color: #666; font-weight: 600;">Days Overdue:</td>
              <td style="padding: 8px 0; color: #dc3545; text-align: right; font-weight: bold; font-size: 16px;">${daysOverdue} of ${gracePeriodDays} days</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666; font-weight: 600;">Days Remaining:</td>
              <td style="padding: 8px 0; color: ${daysRemaining <= 2 ? '#dc3545' : '#856404'}; text-align: right; font-weight: bold; font-size: 20px;">${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}</td>
            </tr>
          </table>
          
          <div style="margin-top: 15px; padding: 15px; background: white; border-radius: 8px; ${daysRemaining <= 2 ? 'border: 2px solid #dc3545;' : ''}">
            <p style="margin: 0; color: ${daysRemaining <= 2 ? '#721c24' : '#856404'}; font-weight: bold; text-align: center;">
              ${daysRemaining <= 2 
                ? '🚨 FINAL WARNING! Your website will be suspended very soon!' 
                : '⚠️ Please make payment before grace period expires.'}
            </p>
          </div>
        </div>
        
        <div style="background: linear-gradient(135deg, #f8d7da 0%, #f5c2c7 100%); padding: 20px; margin: 25px 0; border-radius: 8px; border-left: 4px solid #dc3545;">
          <h3 style="margin-top: 0; color: #721c24; font-size: 18px;">📋 Payment Details</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #666; font-weight: 600;">Invoice Number:</td>
              <td style="padding: 8px 0; color: #333; text-align: right; font-family: 'Courier New', monospace;">${payment.invoiceNumber}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666; font-weight: 600;">Amount Due:</td>
              <td style="padding: 8px 0; color: #dc3545; text-align: right; font-weight: bold; font-size: 20px;">Rs. ${payment.amount.toLocaleString('en-IN')}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666; font-weight: 600;">Original Due Date:</td>
              <td style="padding: 8px 0; color: #333; text-align: right; font-weight: bold;">${new Date(payment.dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
            </tr>
          </table>
        </div>
        
        <div style="background: ${daysRemaining <= 0 ? '#721c24' : '#c0392b'}; color: white; padding: 20px; margin: 25px 0; border-radius: 8px; text-align: center;">
          <p style="margin: 0; font-size: 16px; font-weight: bold;">
            ${daysRemaining > 0 
              ? `⏰ Your website will be automatically suspended in ${daysRemaining} day${daysRemaining > 1 ? 's' : ''} if payment is not received!`
              : '🚫 Your website will be SUSPENDED TODAY if payment is not received immediately!'}
          </p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/payments" 
             style="display: inline-block; background: linear-gradient(135deg, #c0392b 0%, #8e1e1e 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 15px rgba(192, 57, 43, 0.4);">
            Pay Now to Avoid Suspension →
          </a>
        </div>
        
        <div style="background: #d1ecf1; border-left: 4px solid #0c5460; padding: 15px; margin: 20px 0; border-radius: 5px;">
          <p style="margin: 0; color: #0c5460; font-weight: 600;">⚠️ What happens when suspended?</p>
          <ul style="margin: 10px 0 0 0; padding-left: 20px; color: #0c5460;">
            <li>Visitors will see a suspension page instead of your website</li>
            <li>Your website will be completely offline until payment is made</li>
            <li>SEO rankings and business reputation may be negatively affected</li>
            <li>Additional reactivation fees may apply</li>
          </ul>
        </div>
        
        <div style="background: #d4edda; border-left: 4px solid #28a745; padding: 15px; margin: 20px 0; border-radius: 5px;">
          <p style="margin: 0; color: #155724; font-weight: 600;">✅ How to avoid suspension:</p>
          <ol style="margin: 10px 0 0 0; padding-left: 20px; color: #155724;">
            <li><strong>Make payment immediately</strong> through your dashboard</li>
            <li>Contact us if you need a payment arrangement or have questions</li>
            <li>Upload payment proof once paid for immediate verification</li>
          </ol>
        </div>
        
        <p style="color: #555; line-height: 1.6; margin-top: 25px;">This is an urgent matter that requires your immediate attention. Please make payment as soon as possible.</p>
        
        <p style="color: #555; line-height: 1.6;">For urgent assistance, contact us immediately:</p>
        <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 5px 0; color: #555;">📧 <strong>Email:</strong> ${process.env.COMPANY_EMAIL || 'support@panaglo.com'}</p>
          <p style="margin: 5px 0; color: #555;">📞 <strong>Phone:</strong> ${process.env.COMPANY_PHONE || '+91-9876543210'}</p>
          ${process.env.COMPANY_WEBSITE ? `<p style="margin: 5px 0; color: #555;">🌐 <strong>Website:</strong> ${process.env.COMPANY_WEBSITE}</p>` : ''}
        </div>
        
        <p style="margin-top: 30px; color: #555;">Best regards,<br><strong>${process.env.COMPANY_NAME || 'Panaglo'} Team</strong></p>
        </div>
        
        <!-- Footer -->
        <div style="background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; border-top: 3px solid #c0392b;">
          <p style="margin: 0; color: #666; font-size: 12px;">© ${new Date().getFullYear()} ${process.env.COMPANY_NAME || 'Panaglo'}. All rights reserved.</p>
          <p style="margin: 5px 0 0 0; color: #999; font-size: 11px;">This is an automated email. Please do not reply.</p>
        </div>
      </div>
    `;

    return await this.sendEmail({
      to: customer.email,
      subject,
      html
    });
  }

  /**
   * Send final warning (1 day before suspension)
   */
  async sendFinalWarning(customer, site, payment) {
    const subject = `🚨 FINAL WARNING: Website Will Be Suspended Tomorrow - ${site.domain} | ${process.env.COMPANY_NAME || 'Panaglo'}`;
    const html = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); border: 3px solid #dc3545;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #721c24 0%, #4d0000 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 32px; font-weight: bold; text-shadow: 0 2px 10px rgba(0,0,0,0.2);">
            🚨 FINAL WARNING 🚨
          </h1>
          <p style="color: rgba(255,255,255,0.9); margin: 12px 0 0 0; font-size: 18px; font-weight: bold;">
            Website Suspension in 24 Hours
          </p>
        </div>
        
        <!-- Content -->
        <div style="padding: 35px; background: white;">
        <div style="background: #dc3545; color: white; padding: 25px; margin: 0 0 25px 0; border-radius: 8px; text-align: center;">
          <h2 style="margin: 0; color: white; font-size: 24px;">⏰ SUSPENSION IN 24 HOURS</h2>
          <p style="font-size: 16px; margin: 15px 0 0 0;">Tomorrow at this time, <strong>${site.domain}</strong> will be automatically suspended!</p>
        </div>
        
        <p style="font-size: 16px; color: #333;">Dear <strong>${customer.name}</strong>,</p>
        <p style="color: #555; line-height: 1.6;">This is your <strong style="color: #dc3545;">FINAL WARNING</strong>. We have sent multiple reminders regarding your overdue payment.</p>
        
        <div style="background: linear-gradient(135deg, #f8d7da 0%, #f5c2c7 100%); padding: 20px; margin: 25px 0; border-radius: 8px; border-left: 4px solid #dc3545;">
          <h3 style="margin-top: 0; color: #721c24; font-size: 18px;">📋 Outstanding Payment</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #666; font-weight: 600;">Invoice Number:</td>
              <td style="padding: 8px 0; color: #333; text-align: right; font-family: 'Courier New', monospace;">${payment.invoiceNumber}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666; font-weight: 600;">Amount Due:</td>
              <td style="padding: 8px 0; color: #dc3545; text-align: right; font-weight: bold; font-size: 22px;">Rs. ${payment.amount.toLocaleString('en-IN')}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666; font-weight: 600;">Original Due Date:</td>
              <td style="padding: 8px 0; color: #333; text-align: right; font-weight: bold;">${new Date(payment.dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666; font-weight: 600;">Days Overdue:</td>
              <td style="padding: 8px 0; color: #dc3545; text-align: right; font-weight: bold; font-size: 18px;">${Math.ceil((new Date() - new Date(payment.dueDate)) / (1000 * 60 * 60 * 24))} days</td>
            </tr>
          </table>
        </div>
        
        <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 20px; margin: 25px 0; border-radius: 8px;">
          <h3 style="margin-top: 0; color: #856404; font-size: 18px;">⚠️ What Happens When Suspended?</h3>
          <ul style="color: #856404; margin: 10px 0; padding-left: 20px; line-height: 1.8;">
            <li>✗ Your website will be <strong>completely offline</strong></li>
            <li>✗ Visitors will see a <strong>suspension notice page</strong></li>
            <li>✗ Your business will <strong>lose potential customers</strong></li>
            <li>✗ SEO rankings will be <strong>negatively impacted</strong></li>
            <li>✗ Your professional reputation will be <strong>damaged</strong></li>
            <li>✗ Additional <strong>reactivation fees</strong> may apply</li>
          </ul>
        </div>
        
        <div style="background: #d4edda; border-left: 4px solid #28a745; padding: 20px; margin: 25px 0; border-radius: 8px;">
          <h3 style="margin-top: 0; color: #155724; font-size: 18px;">✅ How to Prevent Suspension (ACT NOW!)</h3>
          <ol style="color: #155724; margin: 10px 0; padding-left: 20px; line-height: 1.8; font-weight: 600;">
            <li>Make payment <strong>immediately</strong> through your dashboard</li>
            <li>Upload payment proof for instant verification</li>
            <li>Contact us urgently: ${process.env.COMPANY_EMAIL || 'support@panaglo.com'}</li>
            <li>Call us now: ${process.env.COMPANY_PHONE || '+91-9876543210'}</li>
          </ol>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/payments" 
             style="display: inline-block; background: linear-gradient(135deg, #dc3545 0%, #c82333 100%); color: white; padding: 18px 50px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 18px; box-shadow: 0 4px 15px rgba(220, 53, 69, 0.4);">
            PAY NOW - LAST CHANCE →
          </a>
        </div>
        
        <div style="background: #721c24; color: white; padding: 20px; margin: 25px 0; border-radius: 8px; text-align: center;">
          <p style="margin: 0; font-size: 18px; font-weight: bold;">
            ⚡ THIS IS YOUR LAST CHANCE ⚡
          </p>
          <p style="margin: 10px 0 0 0; font-size: 14px;">
            If we don't receive payment within 24 hours, your website will be automatically suspended without further notice.
          </p>
        </div>
        
        <p style="color: #555; line-height: 1.6; margin-top: 25px;">We strongly urge you to take immediate action to avoid interruption to your online presence.</p>
        
        <p style="color: #555; line-height: 1.6;">For urgent assistance:</p>
        <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 5px 0; color: #555;">📧 <strong>Email:</strong> ${process.env.COMPANY_EMAIL || 'support@panaglo.com'}</p>
          <p style="margin: 5px 0; color: #555;">📞 <strong>Phone:</strong> ${process.env.COMPANY_PHONE || '+91-9876543210'}</p>
          ${process.env.COMPANY_WEBSITE ? `<p style="margin: 5px 0; color: #555;">🌐 <strong>Website:</strong> ${process.env.COMPANY_WEBSITE}</p>` : ''}
        </div>
        
        <p style="margin-top: 30px; color: #555;">Best regards,<br><strong>${process.env.COMPANY_NAME || 'Panaglo'} Team</strong></p>
        </div>
        
        <!-- Footer -->
        <div style="background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; border-top: 3px solid #dc3545;">
          <p style="margin: 0; color: #666; font-size: 12px;">© ${new Date().getFullYear()} ${process.env.COMPANY_NAME || 'Panaglo'}. All rights reserved.</p>
          <p style="margin: 5px 0 0 0; color: #999; font-size: 11px;">This is an automated email. Please do not reply.</p>
        </div>
      </div>
    `;

    return await this.sendEmail({
      to: customer.email,
      subject,
      html
    });
  }

  /**
   * Send suspension notification
   */
  async sendSuspensionNotification(customer, site) {
    const subject = `Website Suspended - ${site.domain}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #c0392b;">Website Suspended</h2>
        <p>Dear ${customer.name},</p>
        <p>Your website <strong>${site.domain}</strong> has been <strong>suspended</strong> due to non-payment.</p>
        
        <div style="background: #f8d7da; padding: 15px; margin: 20px 0; border-radius: 5px;">
          <h3 style="margin-top: 0;">Suspension Details</h3>
          <p><strong>Reason:</strong> Payment overdue</p>
          <p><strong>Suspended On:</strong> ${new Date().toLocaleDateString()}</p>
          <p><strong>Amount Due:</strong> $${site.paymentAmount}</p>
        </div>
        
        <p><strong>To reactivate your website:</strong></p>
        <ol>
          <li>Log in to your customer dashboard</li>
          <li>Navigate to the Payment section</li>
          <li>Make payment and upload proof</li>
          <li>Our team will verify and reactivate your site within 24 hours</li>
        </ol>
        
        <p style="margin-top: 30px;">Contact us for assistance: ${process.env.COMPANY_EMAIL} | ${process.env.COMPANY_PHONE}</p>
        
        <p>Best regards,<br>${process.env.COMPANY_NAME}</p>
      </div>
    `;

    return await this.sendEmail({
      to: customer.email,
      subject,
      html
    });
  }

  /**
   * Send reactivation notification
   */
  async sendReactivationNotification(customer, site) {
    const subject = `Website Reactivated - ${site.domain}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #27ae60;">Website Reactivated</h2>
        <p>Dear ${customer.name},</p>
        <p>Great news! Your website <strong>${site.domain}</strong> has been <strong>reactivated</strong>.</p>
        
        <div style="background: #d4edda; padding: 15px; margin: 20px 0; border-radius: 5px;">
          <p>Your payment has been verified and your website is now live and accessible.</p>
          <p><strong>Next Payment Due:</strong> ${new Date(site.nextPaymentDate).toLocaleDateString()}</p>
        </div>
        
        <p>Thank you for your prompt payment!</p>
        
        <p style="margin-top: 30px;">If you have any questions: ${process.env.COMPANY_EMAIL} | ${process.env.COMPANY_PHONE}</p>
        
        <p>Best regards,<br>${process.env.COMPANY_NAME}</p>
      </div>
    `;

    return await this.sendEmail({
      to: customer.email,
      subject,
      html
    });
  }

  /**
   * Send uptime alert (site down)
   */
  async sendUptimeAlert(customer, site, downtimeMinutes) {
    const subject = `Alert: ${site.domain} is Down`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #e74c3c;">Website Down Alert</h2>
        <p>Dear ${customer.name},</p>
        <p>We detected that your website <strong>${site.domain}</strong> is currently <strong>down</strong>.</p>
        
        <div style="background: #fff3cd; padding: 15px; margin: 20px 0; border-radius: 5px;">
          <p><strong>Domain:</strong> ${site.domain}</p>
          <p><strong>Status:</strong> Unreachable</p>
          <p><strong>Downtime:</strong> ${downtimeMinutes} minutes</p>
          <p><strong>Detected At:</strong> ${new Date().toLocaleString()}</p>
        </div>
        
        <p>Our team has been notified and is investigating the issue.</p>
        
        <p style="margin-top: 30px;">Contact us: ${process.env.COMPANY_EMAIL} | ${process.env.COMPANY_PHONE}</p>
        
        <p>Best regards,<br>${process.env.COMPANY_NAME}</p>
      </div>
    `;

    // Send to customer and any additional notification emails
    const recipients = [customer.email, ...(site.notificationEmails || [])];
    
    for (const email of recipients) {
      await this.sendEmail({ to: email, subject, html });
    }
  }

  /**
   * Send payment proof uploaded notification to admin
   */
  async sendPaymentProofNotification(adminEmail, customer, site, payment) {
    const subject = `Payment Proof Uploaded - ${site.domain}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #3498db;">Payment Proof Uploaded</h2>
        <p>A customer has uploaded payment proof for verification.</p>
        
        <div style="background: #e3f2fd; padding: 15px; margin: 20px 0; border-radius: 5px;">
          <h3 style="margin-top: 0;">Details</h3>
          <p><strong>Customer:</strong> ${customer.name}</p>
          <p><strong>Website:</strong> ${site.domain}</p>
          <p><strong>Invoice:</strong> ${payment.invoiceNumber}</p>
          <p><strong>Amount:</strong> $${payment.amount}</p>
          <p><strong>Uploaded:</strong> ${new Date().toLocaleString()}</p>
        </div>
        
        <p>Please log in to the admin dashboard to verify and approve the payment.</p>
        
        <p>Best regards,<br>${process.env.COMPANY_NAME} System</p>
      </div>
    `;

    return await this.sendEmail({
      to: adminEmail,
      subject,
      html
    });
  }

  /**
   * Send payment receipt with bill PDF to customer
   */
  async sendPaymentReceiptWithBill(customer, site, payment, billPath) {
    const subject = `Payment Receipt - ${payment.invoiceNumber}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Payment Received! ✅</h1>
        </div>
        
        <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
          <div style="background: white; padding: 25px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <p style="font-size: 16px; color: #333;">Dear ${customer.name},</p>
            <p style="font-size: 16px; color: #333;">Thank you for your payment! We have successfully received and verified your payment.</p>
            
            <div style="background: linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%); padding: 20px; margin: 25px 0; border-radius: 8px; text-align: center;">
              <h2 style="color: #1a202c; margin: 0 0 15px 0; font-size: 24px;">Payment Details</h2>
              <div style="background: white; padding: 20px; border-radius: 6px; margin-top: 15px;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 10px; text-align: left; border-bottom: 1px solid #e2e8f0;"><strong>Invoice Number:</strong></td>
                    <td style="padding: 10px; text-align: right; border-bottom: 1px solid #e2e8f0; color: #667eea; font-weight: bold;">${payment.invoiceNumber}</td>
                  </tr>
                  <tr>
                    <td style="padding: 10px; text-align: left; border-bottom: 1px solid #e2e8f0;"><strong>Website:</strong></td>
                    <td style="padding: 10px; text-align: right; border-bottom: 1px solid #e2e8f0;">${site.domain}</td>
                  </tr>
                  <tr>
                    <td style="padding: 10px; text-align: left; border-bottom: 1px solid #e2e8f0;"><strong>Amount Paid:</strong></td>
                    <td style="padding: 10px; text-align: right; border-bottom: 1px solid #e2e8f0; color: #10b981; font-weight: bold; font-size: 18px;">Rs. ${payment.amount.toLocaleString('en-IN')}</td>
                  </tr>
                  <tr>
                    <td style="padding: 10px; text-align: left; border-bottom: 1px solid #e2e8f0;"><strong>Payment Date:</strong></td>
                    <td style="padding: 10px; text-align: right; border-bottom: 1px solid #e2e8f0;">${new Date(payment.paidDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</td>
                  </tr>
                  <tr>
                    <td style="padding: 10px; text-align: left;"><strong>Service Period:</strong></td>
                    <td style="padding: 10px; text-align: right;">${new Date(payment.periodStart).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} - ${new Date(payment.periodEnd).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                  </tr>
                </table>
              </div>
            </div>
            
            <div style="background: #e3f2fd; padding: 20px; border-left: 4px solid #2196f3; border-radius: 4px; margin: 20px 0;">
              <p style="margin: 0; color: #1976d2;"><strong>📄 Invoice Attached</strong></p>
              <p style="margin: 10px 0 0 0; color: #555;">Your official payment receipt/invoice is attached to this email as a PDF document. Please save it for your records.</p>
            </div>
            
            ${site.status === 'active' ? `
            <div style="background: #d4edda; padding: 20px; border-left: 4px solid #28a745; border-radius: 4px; margin: 20px 0;">
              <p style="margin: 0; color: #155724;"><strong>🎉 Website Status: Active</strong></p>
              <p style="margin: 10px 0 0 0; color: #155724;">Your website <strong>${site.domain}</strong> is now active and running!</p>
            </div>
            ` : ''}
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #e2e8f0;">
              <p style="color: #666; font-size: 14px; line-height: 1.6;">
                <strong>Next Payment Due:</strong> ${new Date(site.nextPaymentDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}<br>
                <strong>Amount:</strong> Rs. ${payment.amount.toLocaleString('en-IN')}
              </p>
            </div>
            
            <div style="text-align: center; margin-top: 30px;">
              <p style="color: #666; font-size: 14px;">Need help? Contact us:</p>
              <p style="color: #667eea; font-weight: bold; font-size: 16px;">${process.env.COMPANY_EMAIL || 'support@company.com'}</p>
              <p style="color: #667eea; font-weight: bold; font-size: 16px;">${process.env.COMPANY_PHONE || '+91-1234567890'}</p>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
            <p>Thank you for choosing ${process.env.COMPANY_NAME}!</p>
            <p style="margin: 5px 0;">This is an automated email. Please do not reply.</p>
          </div>
        </div>
      </div>
    `;

    try {
      if (!this.transporter) {
        console.error('Email transporter not initialized');
        return false;
      }

      const mailOptions = {
        from: `${process.env.COMPANY_NAME} <${process.env.EMAIL_FROM}>`,
        to: customer.email,
        subject,
        html,
        text: `Payment Receipt - ${payment.invoiceNumber}\n\nDear ${customer.name},\n\nThank you for your payment! Your payment of Rs. ${payment.amount.toLocaleString('en-IN')} has been received and verified.\n\nInvoice: ${payment.invoiceNumber}\nWebsite: ${site.domain}\nPayment Date: ${new Date(payment.paidDate).toLocaleDateString('en-IN')}\n\nYour invoice is attached to this email.\n\nBest regards,\n${process.env.COMPANY_NAME}`,
        attachments: [
          {
            filename: `${payment.invoiceNumber}.pdf`,
            path: billPath,
            contentType: 'application/pdf'
          }
        ]
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log(`✓ Payment receipt sent to ${customer.email}:`, info.messageId);
      return true;
    } catch (error) {
      console.error('Failed to send payment receipt email:', error.message);
      return false;
    }
  }
}

// Export singleton instance
module.exports = new EmailService();
