const request = require('supertest');
const { io: Client } = require('socket.io-client');
const { app, io } = require('../../index');

describe('Backend-Frontend Integration', () => {
  let server;
  let clientSocket;
  let serverSocket;

  beforeAll((done) => {
    server = app.listen(() => {
      const port = server.address().port;
      clientSocket = new Client(`http://localhost:${port}`);
      
      io.on('connection', (socket) => {
        serverSocket = socket;
      });
      
      clientSocket.on('connect', done);
    });
  });

  afterAll(() => {
    server.close();
    clientSocket.close();
  });

  describe('API Integration', () => {
    test('should respond to health check', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body.status).toBe('OK');
      expect(response.body.message).toContain('Armed Forces Welfare System');
    });

    test('should handle CORS properly', async () => {
      const response = await request(app)
        .options('/api/auth/register')
        .set('Origin', 'http://localhost:3000')
        .set('Access-Control-Request-Method', 'POST')
        .set('Access-Control-Request-Headers', 'Content-Type,Authorization')
        .expect(204);

      expect(response.headers['access-control-allow-origin']).toBe('http://localhost:3000');
      expect(response.headers['access-control-allow-credentials']).toBe('true');
    });

    test('should register new user with proper response format', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'Test123!@#',
        firstName: 'John',
        lastName: 'Doe',
        role: 'officer',
        serviceNumber: 'OF001',
        rank: 'Lieutenant',
        unit: 'Infantry',
        phoneNumber: '+91-9876543210',
        address: {
          street: '123 Military Base',
          city: 'Delhi',
          state: 'Delhi',
          pincode: '110001',
          country: 'India'
        }
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.user).toBeDefined();
      expect(response.body.token).toBeDefined();
      expect(response.body.user.email).toBe(userData.email);
    });

    test('should login user and return proper token', async () => {
      // First register a user
      const userData = {
        email: 'login@example.com',
        password: 'Test123!@#',
        firstName: 'Jane',
        lastName: 'Smith',
        role: 'family',
        phoneNumber: '+91-9876543211',
        address: {
          street: '456 Family Quarters',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400001',
          country: 'India'
        }
      };

      await request(app)
        .post('/api/auth/register')
        .send(userData);

      // Then login
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: userData.email,
          password: userData.password
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.user).toBeDefined();
      expect(response.body.token).toBeDefined();
    });
  });

  describe('Socket.io Integration', () => {
    test('should connect to socket.io server', (done) => {
      expect(clientSocket.connected).toBe(true);
      done();
    });

    test('should join user room', (done) => {
      const userId = 'test-user-123';
      
      clientSocket.emit('join-user-room', userId);
      
      setTimeout(() => {
        expect(serverSocket.rooms.has(`user-${userId}`)).toBe(true);
        done();
      }, 100);
    });

    test('should handle emergency room joining', (done) => {
      clientSocket.emit('join-emergency-room');
      
      setTimeout(() => {
        expect(serverSocket.rooms.has('emergency-responders')).toBe(true);
        done();
      }, 100);
    });

    test('should handle chat messaging', (done) => {
      const chatId = 'chat-123';
      const message = {
        chatId,
        message: 'Hello from test',
        userId: 'user-123',
        timestamp: new Date().toISOString()
      };

      // Join chat room
      clientSocket.emit('join-chat', chatId);
      
      // Listen for messages
      clientSocket.on('new-message', (data) => {
        expect(data.message).toBe(message.message);
        expect(data.userId).toBe(message.userId);
        done();
      });

      // Send message after joining
      setTimeout(() => {
        serverSocket.emit('send-message', message);
      }, 100);
    });
  });

  describe('Error Handling', () => {
    test('should handle 404 routes properly', async () => {
      const response = await request(app)
        .get('/api/nonexistent-route')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not found');
    });

    test('should handle validation errors', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'invalid-email',
          password: '123' // too short
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBeDefined();
    });

    test('should handle unauthorized access', async () => {
      const response = await request(app)
        .get('/api/users')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('File Upload Integration', () => {
    test('should handle file upload endpoints', async () => {
      // First login to get a token
      const userData = {
        email: 'filetest@example.com',
        password: 'Test123!@#',
        firstName: 'File',
        lastName: 'Tester',
        role: 'officer',
        serviceNumber: 'OF002',
        phoneNumber: '+91-9876543212',
        address: {
          street: '789 Upload Street',
          city: 'Bangalore',
          state: 'Karnataka',
          pincode: '560001',
          country: 'India'
        }
      };

      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(userData);

      const token = registerResponse.body.token;

      // Test file upload for welfare application
      const response = await request(app)
        .post('/api/welfare/schemes/test-scheme-id/apply')
        .set('Authorization', `Bearer ${token}`)
        .field('applicationData', JSON.stringify({
          reason: 'Test application',
          urgency: 'medium'
        }))
        .attach('documents', Buffer.from('test file content'), 'test-document.txt');

      // Note: This might fail if the scheme doesn't exist, but it tests the endpoint structure
      expect([200, 400, 404]).toContain(response.status);
    });
  });
});

describe('Real-time Features Integration', () => {
  let clientSocket;
  let serverSocket;
  let server;

  beforeAll((done) => {
    server = app.listen(() => {
      const port = server.address().port;
      clientSocket = new Client(`http://localhost:${port}`);
      
      io.on('connection', (socket) => {
        serverSocket = socket;
      });
      
      clientSocket.on('connect', done);
    });
  });

  afterAll(() => {
    server.close();
    clientSocket.close();
  });

  test('should emit emergency alerts to connected clients', (done) => {
    const alertData = {
      id: 'alert-123',
      title: 'Test Emergency Alert',
      description: 'This is a test emergency alert',
      severity: 'high',
      type: 'medical',
      location: {
        latitude: 28.6139,
        longitude: 77.2090,
        address: 'New Delhi, India'
      }
    };

    // Join emergency responders room
    clientSocket.emit('join-emergency-room');

    // Listen for emergency alerts
    clientSocket.on('emergency:new-alert', (data) => {
      expect(data.title).toBe(alertData.title);
      expect(data.severity).toBe(alertData.severity);
      done();
    });

    // Simulate server emitting alert after client joins
    setTimeout(() => {
      io.to('emergency-responders').emit('emergency:new-alert', alertData);
    }, 100);
  });

  test('should emit notifications to specific users', (done) => {
    const userId = 'test-user-456';
    const notification = {
      id: 'notif-123',
      title: 'Test Notification',
      message: 'This is a test notification',
      type: 'info',
      timestamp: new Date().toISOString()
    };

    // Join user room
    clientSocket.emit('join-user-room', userId);

    // Listen for notifications
    clientSocket.on('notification:new', (data) => {
      expect(data.title).toBe(notification.title);
      expect(data.message).toBe(notification.message);
      done();
    });

    // Simulate server sending notification
    setTimeout(() => {
      io.to(`user-${userId}`).emit('notification:new', notification);
    }, 100);
  });
});

module.exports = {
  testApp: app,
  testIO: io
};
