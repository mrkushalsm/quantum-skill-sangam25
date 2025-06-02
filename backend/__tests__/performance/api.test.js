// Performance Tests for Armed Forces Welfare Management System
const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');

// Import route modules
const authRoutes = require('../../routes/auth');
const welfareRoutes = require('../../routes/welfare');
const emergencyRoutes = require('../../routes/emergency');
const grievanceRoutes = require('../../routes/grievance');
const marketplaceRoutes = require('../../routes/marketplace');

// Import middleware
const auth = require('../../middleware/auth');
const errorHandler = require('../../middleware/errorHandler');

describe('Performance Tests', () => {
  let app;
  let authToken;
  
  beforeAll(async () => {
    // Create Express app for performance testing
    app = express();
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    
    // Add routes
    app.use('/api/auth', authRoutes);
    app.use('/api/welfare', auth, welfareRoutes);
    app.use('/api/emergency', auth, emergencyRoutes);
    app.use('/api/grievance', auth, grievanceRoutes);
    app.use('/api/marketplace', auth, marketplaceRoutes);
    app.use(errorHandler);

    // Get auth token for authenticated requests
    authToken = global.generateTestToken('user123', 'family_member');
  });

  describe('Response Time Tests', () => {
    it('should respond to health check within 100ms', async () => {
      const start = Date.now();
      
      const response = await request(app)
        .get('/api/auth/health')
        .expect(200);
      
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(100);
    });

    it('should handle user registration within 500ms', async () => {
      const start = Date.now();
      
      const userData = {
        email: `test_${Date.now()}@example.com`,
        firebaseToken: 'valid_token',
        firstName: 'John',
        lastName: 'Doe',
        role: 'family_member',
        serviceNumber: `SN${Date.now()}`,
        dateOfBirth: '1990-01-01'
      };

      await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);
      
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(500);
    });

    it('should fetch welfare schemes within 300ms', async () => {
      const start = Date.now();
      
      await request(app)
        .get('/api/welfare/schemes')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(300);
    });

    it('should create application within 400ms', async () => {
      const start = Date.now();
      
      const applicationData = {
        schemeId: global.testScheme._id,
        personalDetails: {
          applicantName: 'John Doe',
          relationshipToServiceMember: 'self',
          contactNumber: '9876543210',
          alternateContactNumber: '9876543211',
          address: {
            street: '123 Main St',
            city: 'Delhi',
            state: 'Delhi',
            pincode: '110001',
            country: 'India'
          }
        },
        documents: [],
        bankDetails: {
          accountNumber: '1234567890',
          ifscCode: 'HDFC0000123',
          bankName: 'HDFC Bank',
          branchName: 'Main Branch'
        }
      };

      await request(app)
        .post('/api/welfare/applications')
        .set('Authorization', `Bearer ${authToken}`)
        .send(applicationData)
        .expect(201);
      
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(400);
    });
  });

  describe('Load Tests - Concurrent Requests', () => {
    it('should handle 50 concurrent welfare scheme requests', async () => {
      const promises = [];
      const start = Date.now();
      
      for (let i = 0; i < 50; i++) {
        const promise = request(app)
          .get('/api/welfare/schemes')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);
        promises.push(promise);
      }
      
      const results = await Promise.all(promises);
      const duration = Date.now() - start;
      
      expect(results).toHaveLength(50);
      expect(duration).toBeLessThan(3000); // All 50 requests should complete within 3 seconds
    });

    it('should handle 25 concurrent application submissions', async () => {
      const promises = [];
      const start = Date.now();
      
      for (let i = 0; i < 25; i++) {
        const applicationData = {
          schemeId: global.testScheme._id,
          personalDetails: {
            applicantName: `Test User ${i}`,
            relationshipToServiceMember: 'self',
            contactNumber: `987654321${i}`,
            address: {
              street: `${i} Test St`,
              city: 'Delhi',
              state: 'Delhi',
              pincode: '110001',
              country: 'India'
            }
          },
          documents: [],
          bankDetails: {
            accountNumber: `123456789${i}`,
            ifscCode: 'HDFC0000123',
            bankName: 'HDFC Bank',
            branchName: 'Main Branch'
          }
        };

        const promise = request(app)
          .post('/api/welfare/applications')
          .set('Authorization', `Bearer ${authToken}`)
          .send(applicationData);
        promises.push(promise);
      }
      
      const results = await Promise.allSettled(promises);
      const duration = Date.now() - start;
      
      const successful = results.filter(r => r.status === 'fulfilled').length;
      expect(successful).toBeGreaterThan(20); // At least 80% success rate
      expect(duration).toBeLessThan(5000); // All requests should complete within 5 seconds
    });

    it('should handle 100 concurrent emergency alert fetches', async () => {
      const promises = [];
      const start = Date.now();
      
      for (let i = 0; i < 100; i++) {
        const promise = request(app)
          .get('/api/emergency/alerts')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);
        promises.push(promise);
      }
      
      const results = await Promise.all(promises);
      const duration = Date.now() - start;
      
      expect(results).toHaveLength(100);
      expect(duration).toBeLessThan(4000); // All 100 requests should complete within 4 seconds
    });
  });

  describe('Memory Usage Tests', () => {
    it('should not have memory leaks during repeated requests', async () => {
      const initialMemory = process.memoryUsage().heapUsed;
      
      // Make 1000 requests
      for (let i = 0; i < 1000; i++) {
        await request(app)
          .get('/api/welfare/schemes')
          .set('Authorization', `Bearer ${authToken}`);
        
        // Force garbage collection every 100 requests
        if (i % 100 === 0 && global.gc) {
          global.gc();
        }
      }
      
      // Force final garbage collection
      if (global.gc) {
        global.gc();
      }
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      
      // Memory increase should be reasonable (less than 50MB)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
    });
  });

  describe('Database Performance Tests', () => {
    it('should handle complex queries efficiently', async () => {
      const start = Date.now();
      
      // Complex query with multiple filters and pagination
      await request(app)
        .get('/api/welfare/schemes')
        .query({
          category: 'education',
          status: 'active',
          page: 1,
          limit: 20,
          sort: 'name',
          search: 'grant'
        })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(200);
    });

    it('should handle aggregation queries efficiently', async () => {
      const start = Date.now();
      
      await request(app)
        .get('/api/welfare/statistics')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(300);
    });

    it('should handle large result sets with pagination', async () => {
      const start = Date.now();
      
      await request(app)
        .get('/api/welfare/applications')
        .query({
          page: 1,
          limit: 100
        })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(400);
    });
  });

  describe('File Upload Performance Tests', () => {
    it('should handle file uploads within reasonable time', async () => {
      const start = Date.now();
      
      // Create a mock file buffer (1MB)
      const fileBuffer = Buffer.alloc(1024 * 1024, 'test data');
      
      await request(app)
        .post('/api/welfare/applications')
        .set('Authorization', `Bearer ${authToken}`)
        .field('schemeId', global.testScheme._id)
        .field('personalDetails[applicantName]', 'John Doe')
        .field('personalDetails[relationshipToServiceMember]', 'self')
        .field('personalDetails[contactNumber]', '9876543210')
        .field('personalDetails[address][street]', '123 Main St')
        .field('personalDetails[address][city]', 'Delhi')
        .field('personalDetails[address][state]', 'Delhi')
        .field('personalDetails[address][pincode]', '110001')
        .field('personalDetails[address][country]', 'India')
        .field('bankDetails[accountNumber]', '1234567890')
        .field('bankDetails[ifscCode]', 'HDFC0000123')
        .field('bankDetails[bankName]', 'HDFC Bank')
        .field('bankDetails[branchName]', 'Main Branch')
        .attach('documents', fileBuffer, 'test-document.pdf')
        .expect(201);
      
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(2000); // Should complete within 2 seconds
    });
  });

  describe('API Rate Limiting Performance', () => {
    it('should handle requests within rate limits efficiently', async () => {
      const promises = [];
      const start = Date.now();
      
      // Send requests up to but not exceeding rate limit
      for (let i = 0; i < 10; i++) {
        const promise = request(app)
          .get('/api/welfare/schemes')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);
        promises.push(promise);
      }
      
      const results = await Promise.all(promises);
      const duration = Date.now() - start;
      
      expect(results).toHaveLength(10);
      expect(duration).toBeLessThan(1000);
    });
  });

  describe('JSON Processing Performance', () => {
    it('should handle large JSON payloads efficiently', async () => {
      const start = Date.now();
      
      // Create a large application with multiple documents
      const largeApplicationData = {
        schemeId: global.testScheme._id,
        personalDetails: {
          applicantName: 'John Doe',
          relationshipToServiceMember: 'self',
          contactNumber: '9876543210',
          address: {
            street: '123 Main St',
            city: 'Delhi',
            state: 'Delhi',
            pincode: '110001',
            country: 'India'
          }
        },
        documents: Array(100).fill().map((_, i) => ({
          name: `document_${i}.pdf`,
          type: 'application/pdf',
          size: 1024 * 1024
        })),
        bankDetails: {
          accountNumber: '1234567890',
          ifscCode: 'HDFC0000123',
          bankName: 'HDFC Bank',
          branchName: 'Main Branch'
        },
        additionalInfo: Array(1000).fill().map((_, i) => ({
          key: `field_${i}`,
          value: `value_${i}`.repeat(100)
        }))
      };

      await request(app)
        .post('/api/welfare/applications')
        .set('Authorization', `Bearer ${authToken}`)
        .send(largeApplicationData)
        .expect(201);
      
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(1000);
    });
  });

  describe('Error Handling Performance', () => {
    it('should handle validation errors quickly', async () => {
      const start = Date.now();
      
      // Send invalid data that will trigger validation errors
      await request(app)
        .post('/api/welfare/applications')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          // Missing required fields
          personalDetails: {}
        })
        .expect(400);
      
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(100);
    });

    it('should handle authentication errors quickly', async () => {
      const start = Date.now();
      
      await request(app)
        .get('/api/welfare/schemes')
        .set('Authorization', 'Bearer invalid_token')
        .expect(401);
      
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(50);
    });
  });

  describe('Search Performance Tests', () => {
    it('should handle text search queries efficiently', async () => {
      const start = Date.now();
      
      await request(app)
        .get('/api/welfare/schemes')
        .query({
          search: 'education grant scholarship'
        })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(250);
    });

    it('should handle marketplace search efficiently', async () => {
      const start = Date.now();
      
      await request(app)
        .get('/api/marketplace/items')
        .query({
          search: 'laptop computer electronics',
          category: 'electronics',
          condition: 'good'
        })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(200);
    });
  });

  afterAll(async () => {
    // Clean up any test data created during performance tests
    await global.cleanDatabase();
  });
});
