const nodemailer = require('nodemailer');
const logger = require('../config/logger');

class EmailService {
  constructor() {
    this.transporter = null;
    this.init();
  }

  init() {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      logger.warn('Email service not configured - missing EMAIL_USER or EMAIL_PASS');
      return;
    }

    this.transporter = nodemailer.createTransporter({
      service: process.env.EMAIL_SERVICE || 'gmail',
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: process.env.EMAIL_PORT || 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    // Verify connection
    this.transporter.verify((error, success) => {
      if (error) {
        logger.error('Email service connection failed:', error);
      } else {
        logger.info('Email service connected successfully');
      }
    });
  }

  async sendEmail({ to, subject, html, text, attachments = [] }) {
    if (!this.transporter) {
      logger.error('Email service not initialized');
      return { success: false, error: 'Email service not configured' };
    }

    try {
      const mailOptions = {
        from: {
          name: 'Armed Forces Welfare Management System',
          address: process.env.EMAIL_USER
        },
        to,
        subject,
        html,
        text,
        attachments
      };

      const result = await this.transporter.sendMail(mailOptions);
      logger.info(`Email sent successfully to ${to}`, { messageId: result.messageId });
      
      return { 
        success: true, 
        messageId: result.messageId,
        response: result.response 
      };
    } catch (error) {
      logger.error('Failed to send email:', error);
      return { 
        success: false, 
        error: error.message 
      };
    }
  }

  async sendWelcomeEmail(user) {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #2c5aa0; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
          .button { background: #2c5aa0; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to Armed Forces Welfare Management System</h1>
          </div>
          <div class="content">
            <h2>Hello ${user.profile.firstName} ${user.profile.lastName}!</h2>
            <p>Welcome to the Armed Forces Welfare Management System. Your account has been successfully created.</p>
            
            <h3>Your Account Details:</h3>
            <ul>
              <li><strong>Email:</strong> ${user.email}</li>
              <li><strong>Role:</strong> ${user.role}</li>
              <li><strong>Service Number:</strong> ${user.profile.serviceNumber || 'N/A'}</li>
              <li><strong>Unit:</strong> ${user.profile.unit || 'N/A'}</li>
            </ul>
            
            <p>With this system, you can:</p>
            <ul>
              <li>Apply for welfare schemes and benefits</li>
              <li>Receive emergency alerts and notifications</li>
              <li>Use the marketplace for buying and selling</li>
              <li>Submit and track grievances</li>
              <li>Connect with the armed forces community</li>
            </ul>
            
            <p>
              <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}" class="button">
                Access Portal
              </a>
            </p>
            
            <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
            
            <p>Thank you for your service!</p>
          </div>
          <div class="footer">
            <p>Armed Forces Welfare Management System</p>
            <p>This is an automated message. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail({
      to: user.email,
      subject: 'Welcome to Armed Forces Welfare Management System',
      html,
      text: `Welcome to AFWMS! Your account has been created successfully. Visit ${process.env.FRONTEND_URL || 'http://localhost:5173'} to access the portal.`
    });
  }

  async sendApplicationStatusEmail(user, application, scheme) {
    const statusMessages = {
      submitted: 'Your application has been submitted successfully and is under review.',
      under_review: 'Your application is currently under review by our team.',
      approved: '🎉 Congratulations! Your application has been approved.',
      rejected: 'Unfortunately, your application has been rejected.'
    };

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #2c5aa0; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .status-box { padding: 15px; border-radius: 5px; margin: 15px 0; }
          .approved { background: #d4edda; border: 1px solid #c3e6cb; color: #155724; }
          .rejected { background: #f8d7da; border: 1px solid #f5c6cb; color: #721c24; }
          .under_review { background: #fff3cd; border: 1px solid #ffeaa7; color: #856404; }
          .submitted { background: #d1ecf1; border: 1px solid #bee5eb; color: #0c5460; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Application Status Update</h1>
          </div>
          <div class="content">
            <h2>Hello ${user.profile.firstName}!</h2>
            
            <div class="status-box ${application.status}">
              <h3>Status: ${application.status.toUpperCase().replace('_', ' ')}</h3>
              <p>${statusMessages[application.status]}</p>
            </div>
            
            <h3>Application Details:</h3>
            <ul>
              <li><strong>Scheme:</strong> ${scheme.name}</li>
              <li><strong>Applied On:</strong> ${application.submittedAt ? new Date(application.submittedAt).toLocaleDateString() : 'N/A'}</li>
              <li><strong>Current Status:</strong> ${application.status}</li>
            </ul>
            
            ${application.reviewNotes ? `
              <h3>Review Notes:</h3>
              <p>${application.reviewNotes}</p>
            ` : ''}
            
            <p>
              <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/applications" 
                 style="background: #2c5aa0; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
                View Application
              </a>
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail({
      to: user.email,
      subject: `Application Status Update - ${scheme.name}`,
      html,
      text: `Your application for ${scheme.name} status has been updated to: ${application.status}. ${statusMessages[application.status]}`
    });
  }

  async sendEmergencyAlertEmail(user, alert) {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #dc3545; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .alert-box { padding: 15px; border-radius: 5px; margin: 15px 0; background: #f8d7da; border: 1px solid #f5c6cb; }
          .severity { font-weight: bold; text-transform: uppercase; }
          .critical { color: #dc3545; }
          .high { color: #fd7e14; }
          .medium { color: #ffc107; }
          .low { color: #28a745; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🚨 EMERGENCY ALERT 🚨</h1>
          </div>
          <div class="content">
            <div class="alert-box">
              <h2>${alert.title}</h2>
              <p class="severity ${alert.severity}">Severity: ${alert.severity}</p>
              <p><strong>Message:</strong> ${alert.message}</p>
              
              ${alert.location ? `
                <p><strong>Location:</strong> ${alert.location.address || 'Location coordinates provided'}</p>
              ` : ''}
              
              <p><strong>Time:</strong> ${new Date(alert.createdAt).toLocaleString()}</p>
            </div>
            
            <p><strong>Action Required:</strong> Please check the emergency portal for detailed instructions and updates.</p>
            
            <p>
              <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/emergency" 
                 style="background: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
                View Emergency Portal
              </a>
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail({
      to: user.email,
      subject: `🚨 EMERGENCY ALERT - ${alert.title}`,
      html,
      text: `EMERGENCY ALERT - ${alert.title}. Severity: ${alert.severity}. Message: ${alert.message}. Check emergency portal for details.`
    });
  }
  async sendPasswordResetEmail(user, resetToken) {
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #2c5aa0; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Password Reset Request</h1>
          </div>
          <div class="content">
            <h2>Hello ${user.profile.firstName}!</h2>
            <p>You have requested to reset your password for the Armed Forces Welfare Management System.</p>
            
            <p>
              <a href="${resetUrl}" 
                 style="background: #2c5aa0; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
                Reset Password
              </a>
            </p>
            
            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <p><a href="${resetUrl}">${resetUrl}</a></p>
            
            <p><strong>This link will expire in 1 hour.</strong></p>
            
            <p>If you didn't request this password reset, please ignore this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail({
      to: user.email,
      subject: 'Password Reset Request - AFWMS',
      html,
      text: `Password reset requested. Click this link to reset: ${resetUrl} (expires in 1 hour)`
    });
  }

  async sendGrievanceUpdateEmail(user, grievance) {
    const statusMessages = {
      open: 'Your grievance has been submitted and assigned a ticket number.',
      in_progress: 'Your grievance is currently being investigated.',
      resolved: '✅ Your grievance has been resolved.',
      escalated: '⚠️ Your grievance has been escalated to higher authorities.',
      closed: 'Your grievance has been closed.'
    };

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #6c757d; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Grievance Update</h1>
          </div>
          <div class="content">
            <h2>Hello ${user.profile.firstName}!</h2>
            <p>Status: ${grievance.status} - ${statusMessages[grievance.status]}</p>
            <p>Ticket: #${grievance.ticketNumber}</p>
            <p>
              <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/grievances/${grievance._id}" 
                 style="background: #6c757d; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
                View Grievance
              </a>
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail({
      to: user.email,
      subject: `Grievance Update - Ticket #${grievance.ticketNumber}`,
      html,
      text: `Grievance Update: Ticket #${grievance.ticketNumber} status changed to ${grievance.status}.`
    });
  }

  // Utility methods
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  async testConnection() {
    if (!this.transporter) {
      return { success: false, error: 'Email service not configured' };
    }

    try {
      await this.transporter.verify();
      return { success: true, message: 'Email service connection successful' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

module.exports = new EmailService();
