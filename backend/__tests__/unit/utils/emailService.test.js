const EmailService = require('../../../utils/emailService');
const logger = require('../../../config/logger');

// Mock nodemailer
const mockSendMail = jest.fn();
const mockVerify = jest.fn();
const mockCreateTransporter = jest.fn(() => ({
  sendMail: mockSendMail,
  verify: mockVerify
}));

jest.mock('nodemailer', () => ({
  createTransporter: mockCreateTransporter
}));

// Mock logger
jest.mock('../../../config/logger', () => ({
  warn: jest.fn(),
  error: jest.fn(),
  info: jest.fn()
}));

describe('EmailService', () => {
  let emailService;
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Set up environment variables
    process.env = {
      ...originalEnv,
      EMAIL_USER: 'test@army.mil',
      EMAIL_PASS: 'testpassword',
      EMAIL_SERVICE: 'gmail',
      EMAIL_HOST: 'smtp.gmail.com',
      EMAIL_PORT: '587'
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('Initialization', () => {
    test('should initialize with valid environment variables', () => {
      mockVerify.mockImplementation((callback) => {
        callback(null, true);
      });

      emailService = new EmailService();

      expect(mockCreateTransporter).toHaveBeenCalledWith({
        service: 'gmail',
        host: 'smtp.gmail.com',
        port: '587',
        secure: false,
        auth: {
          user: 'test@army.mil',
          pass: 'testpassword'
        },
        tls: {
          rejectUnauthorized: false
        }
      });

      expect(logger.info).toHaveBeenCalledWith('Email service connected successfully');
    });

    test('should handle missing EMAIL_USER', () => {
      delete process.env.EMAIL_USER;
      
      emailService = new EmailService();

      expect(logger.warn).toHaveBeenCalledWith('Email service not configured - missing EMAIL_USER or EMAIL_PASS');
      expect(mockCreateTransporter).not.toHaveBeenCalled();
    });

    test('should handle missing EMAIL_PASS', () => {
      delete process.env.EMAIL_PASS;
      
      emailService = new EmailService();

      expect(logger.warn).toHaveBeenCalledWith('Email service not configured - missing EMAIL_USER or EMAIL_PASS');
      expect(mockCreateTransporter).not.toHaveBeenCalled();
    });

    test('should use default values for optional environment variables', () => {
      delete process.env.EMAIL_SERVICE;
      delete process.env.EMAIL_HOST;
      delete process.env.EMAIL_PORT;

      mockVerify.mockImplementation((callback) => {
        callback(null, true);
      });

      emailService = new EmailService();

      expect(mockCreateTransporter).toHaveBeenCalledWith({
        service: 'gmail',
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
          user: 'test@army.mil',
          pass: 'testpassword'
        },
        tls: {
          rejectUnauthorized: false
        }
      });
    });

    test('should handle transporter verification error', () => {
      mockVerify.mockImplementation((callback) => {
        callback(new Error('Connection failed'), false);
      });

      emailService = new EmailService();

      expect(logger.error).toHaveBeenCalledWith('Email service connection failed:', new Error('Connection failed'));
    });
  });

  describe('sendEmail method', () => {
    beforeEach(() => {
      mockVerify.mockImplementation((callback) => {
        callback(null, true);
      });
      emailService = new EmailService();
    });

    test('should send email successfully', async () => {
      const mockResult = {
        messageId: 'test-message-id-123',
        response: '250 OK'
      };
      mockSendMail.mockResolvedValue(mockResult);

      const emailOptions = {
        to: 'recipient@army.mil',
        subject: 'Test Email',
        html: '<h1>Test HTML Content</h1>',
        text: 'Test plain text content'
      };

      const result = await emailService.sendEmail(emailOptions);

      expect(mockSendMail).toHaveBeenCalledWith({
        from: {
          name: 'Armed Forces Welfare Management System',
          address: 'test@army.mil'
        },
        to: 'recipient@army.mil',
        subject: 'Test Email',
        html: '<h1>Test HTML Content</h1>',
        text: 'Test plain text content',
        attachments: []
      });

      expect(result).toEqual({
        success: true,
        messageId: 'test-message-id-123',
        response: '250 OK'
      });

      expect(logger.info).toHaveBeenCalledWith(
        'Email sent successfully to recipient@army.mil',
        { messageId: 'test-message-id-123' }
      );
    });

    test('should send email with attachments', async () => {
      const mockResult = {
        messageId: 'test-message-id-456',
        response: '250 OK'
      };
      mockSendMail.mockResolvedValue(mockResult);

      const attachments = [
        {
          filename: 'document.pdf',
          path: '/path/to/document.pdf'
        }
      ];

      const emailOptions = {
        to: 'recipient@army.mil',
        subject: 'Email with Attachment',
        html: '<p>Please find attached document</p>',
        attachments
      };

      const result = await emailService.sendEmail(emailOptions);

      expect(mockSendMail).toHaveBeenCalledWith({
        from: {
          name: 'Armed Forces Welfare Management System',
          address: 'test@army.mil'
        },
        to: 'recipient@army.mil',
        subject: 'Email with Attachment',
        html: '<p>Please find attached document</p>',
        text: undefined,
        attachments
      });

      expect(result.success).toBe(true);
    });

    test('should handle email sending error', async () => {
      const error = new Error('SMTP server unavailable');
      mockSendMail.mockRejectedValue(error);

      const emailOptions = {
        to: 'recipient@army.mil',
        subject: 'Test Email',
        html: '<h1>Test Content</h1>'
      };

      const result = await emailService.sendEmail(emailOptions);

      expect(result).toEqual({
        success: false,
        error: 'SMTP server unavailable'
      });

      expect(logger.error).toHaveBeenCalledWith('Failed to send email:', error);
    });

    test('should handle uninitialized transporter', async () => {
      // Create email service without proper initialization
      delete process.env.EMAIL_USER;
      const uninitializedService = new EmailService();

      const emailOptions = {
        to: 'recipient@army.mil',
        subject: 'Test Email',
        html: '<h1>Test Content</h1>'
      };

      const result = await uninitializedService.sendEmail(emailOptions);

      expect(result).toEqual({
        success: false,
        error: 'Email service not configured'
      });

      expect(logger.error).toHaveBeenCalledWith('Email service not initialized');
    });
  });

  describe('sendWelcomeEmail method', () => {
    beforeEach(() => {
      mockVerify.mockImplementation((callback) => {
        callback(null, true);
      });
      emailService = new EmailService();
    });

    test('should send welcome email to officer', async () => {
      const mockResult = {
        messageId: 'welcome-message-id',
        response: '250 OK'
      };
      mockSendMail.mockResolvedValue(mockResult);

      const user = {
        email: 'officer@army.mil',
        profile: {
          firstName: 'John',
          lastName: 'Doe'
        },
        role: 'officer',
        serviceNumber: 'OFF001',
        rank: 'Captain',
        unit: '1st Battalion'
      };

      const result = await emailService.sendWelcomeEmail(user);

      expect(mockSendMail).toHaveBeenCalled();
      const callArgs = mockSendMail.mock.calls[0][0];
      
      expect(callArgs.to).toBe('officer@army.mil');
      expect(callArgs.subject).toBe('Welcome to Armed Forces Welfare Management System');
      expect(callArgs.html).toContain('Hello John Doe!');
      expect(callArgs.html).toContain('officer@army.mil');
      
      expect(result.success).toBe(true);
    });

    test('should send welcome email to family member', async () => {
      const mockResult = {
        messageId: 'welcome-family-message-id',
        response: '250 OK'
      };
      mockSendMail.mockResolvedValue(mockResult);

      const user = {
        email: 'family@army.mil',
        profile: {
          firstName: 'Jane',
          lastName: 'Doe'
        },
        role: 'family_member',
        relationToOfficer: 'spouse',
        officerServiceNumber: 'OFF001'
      };

      const result = await emailService.sendWelcomeEmail(user);

      expect(mockSendMail).toHaveBeenCalled();
      const callArgs = mockSendMail.mock.calls[0][0];
      
      expect(callArgs.to).toBe('family@army.mil');
      expect(callArgs.subject).toBe('Welcome to Armed Forces Welfare Management System');
      expect(callArgs.html).toContain('Hello Jane Doe!');
      
      expect(result.success).toBe(true);
    });

    test('should handle welcome email sending error', async () => {
      const error = new Error('Failed to send welcome email');
      mockSendMail.mockRejectedValue(error);

      const user = {
        email: 'test@army.mil',
        profile: {
          firstName: 'Test',
          lastName: 'User'
        },
        role: 'officer'
      };

      const result = await emailService.sendWelcomeEmail(user);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to send welcome email');
    });
  });

  describe('sendApplicationStatusEmail method', () => {
    beforeEach(() => {
      mockVerify.mockImplementation((callback) => {
        callback(null, true);
      });
      emailService = new EmailService();
    });

    test('should send application approved email', async () => {
      const mockResult = {
        messageId: 'status-message-id',
        response: '250 OK'
      };
      mockSendMail.mockResolvedValue(mockResult);

      const applicationData = {
        applicantEmail: 'applicant@army.mil',
        applicantName: 'John Doe',
        applicationId: 'APP-001-2024',
        schemeName: 'Housing Assistance Scheme',
        status: 'approved',
        approvalDate: new Date('2024-06-02')
      };

      const result = await emailService.sendApplicationStatusEmail(applicationData);

      expect(mockSendMail).toHaveBeenCalled();
      const callArgs = mockSendMail.mock.calls[0][0];
      
      expect(callArgs.to).toBe('applicant@army.mil');
      expect(callArgs.subject).toBe('Application Status Update - Housing Assistance Scheme');
      expect(callArgs.html).toContain('John Doe');
      expect(callArgs.html).toContain('APP-001-2024');
      expect(callArgs.html).toContain('approved');
      
      expect(result.success).toBe(true);
    });

    test('should send application rejected email', async () => {
      const mockResult = {
        messageId: 'rejection-message-id',
        response: '250 OK'
      };
      mockSendMail.mockResolvedValue(mockResult);

      const applicationData = {
        applicantEmail: 'applicant@army.mil',
        applicantName: 'John Doe',
        applicationId: 'APP-002-2024',
        schemeName: 'Education Assistance Scheme',
        status: 'rejected',
        rejectionReason: 'Incomplete documentation',
        rejectionDate: new Date('2024-06-02')
      };

      const result = await emailService.sendApplicationStatusEmail(applicationData);

      expect(mockSendMail).toHaveBeenCalled();
      const callArgs = mockSendMail.mock.calls[0][0];
      
      expect(callArgs.to).toBe('applicant@army.mil');
      expect(callArgs.subject).toBe('Application Status Update - Education Assistance Scheme');
      expect(callArgs.html).toContain('rejected');
      expect(callArgs.html).toContain('Incomplete documentation');
      
      expect(result.success).toBe(true);
    });
  });

  describe('sendPasswordResetEmail method', () => {
    beforeEach(() => {
      mockVerify.mockImplementation((callback) => {
        callback(null, true);
      });
      emailService = new EmailService();
    });

    test('should send password reset email', async () => {
      const mockResult = {
        messageId: 'reset-message-id',
        response: '250 OK'
      };
      mockSendMail.mockResolvedValue(mockResult);

      const resetData = {
        email: 'user@army.mil',
        name: 'John Doe',
        resetToken: 'reset-token-123',
        resetUrl: 'https://welfare.army.mil/reset-password?token=reset-token-123'
      };

      const result = await emailService.sendPasswordResetEmail(resetData);

      expect(mockSendMail).toHaveBeenCalled();
      const callArgs = mockSendMail.mock.calls[0][0];
      
      expect(callArgs.to).toBe('user@army.mil');
      expect(callArgs.subject).toBe('Password Reset Request - Armed Forces Welfare System');
      expect(callArgs.html).toContain('John Doe');
      expect(callArgs.html).toContain('reset-token-123');
      
      expect(result.success).toBe(true);
    });
  });

  describe('sendEmergencyAlert method', () => {
    beforeEach(() => {
      mockVerify.mockImplementation((callback) => {
        callback(null, true);
      });
      emailService = new EmailService();
    });

    test('should send emergency alert email', async () => {
      const mockResult = {
        messageId: 'emergency-message-id',
        response: '250 OK'
      };
      mockSendMail.mockResolvedValue(mockResult);

      const alertData = {
        recipients: ['emergency1@army.mil', 'emergency2@army.mil'],
        alertType: 'Medical Emergency',
        location: 'New Delhi Cantonment',
        description: 'Medical assistance required urgently',
        reportedBy: 'John Doe',
        contactNumber: '+919876543210',
        timestamp: new Date('2024-06-02T10:30:00Z')
      };

      const result = await emailService.sendEmergencyAlert(alertData);

      expect(mockSendMail).toHaveBeenCalledTimes(2);
      
      const firstCall = mockSendMail.mock.calls[0][0];
      const secondCall = mockSendMail.mock.calls[1][0];
      
      expect(firstCall.to).toBe('emergency1@army.mil');
      expect(secondCall.to).toBe('emergency2@army.mil');
      
      expect(firstCall.subject).toBe('🚨 EMERGENCY ALERT - Medical Emergency');
      expect(firstCall.html).toContain('Medical Emergency');
      expect(firstCall.html).toContain('New Delhi Cantonment');
      expect(firstCall.html).toContain('John Doe');
      
      expect(result.success).toBe(true);
    });

    test('should handle partial failure in emergency alerts', async () => {
      mockSendMail
        .mockResolvedValueOnce({ messageId: 'success-id', response: '250 OK' })
        .mockRejectedValueOnce(new Error('Failed to send to second recipient'));

      const alertData = {
        recipients: ['emergency1@army.mil', 'emergency2@army.mil'],
        alertType: 'Security Alert',
        location: 'Mumbai Cantonment',
        description: 'Security breach reported'
      };

      const result = await emailService.sendEmergencyAlert(alertData);

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.successCount).toBe(1);
      expect(result.totalCount).toBe(2);
    });
  });

  describe('Error Handling', () => {
    test('should handle transporter creation error', () => {
      mockCreateTransporter.mockImplementation(() => {
        throw new Error('Failed to create transporter');
      });

      // This should not throw, but should log the error
      expect(() => new EmailService()).not.toThrow();
    });

    test('should handle undefined user in welcome email', async () => {
      mockVerify.mockImplementation((callback) => {
        callback(null, true);
      });
      emailService = new EmailService();

      const result = await emailService.sendWelcomeEmail(undefined);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Cannot read');
    });
  });
});
