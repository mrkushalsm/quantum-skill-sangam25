// Mock implementation for email service during tests
const emailServiceMock = {
  createTransporter: jest.fn().mockReturnValue({
    sendMail: jest.fn().mockResolvedValue({
      messageId: 'test-message-id',
      response: 'Message sent successfully'
    })
  }),
  
  sendEmail: jest.fn().mockResolvedValue({
    success: true,
    messageId: 'test-message-id'
  }),
  
  sendWelcomeEmail: jest.fn().mockResolvedValue({
    success: true,
    messageId: 'test-welcome-message-id'
  }),
  
  sendPasswordResetEmail: jest.fn().mockResolvedValue({
    success: true,
    messageId: 'test-reset-message-id'
  }),
  
  sendNotificationEmail: jest.fn().mockResolvedValue({
    success: true,
    messageId: 'test-notification-message-id'
  }),
  
  sendApplicationUpdateEmail: jest.fn().mockResolvedValue({
    success: true,
    messageId: 'test-app-update-message-id'
  }),
  
  sendGrievanceStatusEmail: jest.fn().mockResolvedValue({
    success: true,
    messageId: 'test-grievance-message-id'
  }),
  
  sendEmergencyAlertEmail: jest.fn().mockResolvedValue({
    success: true,
    messageId: 'test-emergency-message-id'
  })
};

module.exports = emailServiceMock;
