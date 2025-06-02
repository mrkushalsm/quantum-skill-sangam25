const request = require('supertest');
const app = require('../index');
const { setupTestDB } = require('./helpers/db');

describe('Health Check API', () => {
  // Setup test database
  setupTestDB();

  describe('GET /api/health', () => {
    it('should return 200 and database status when database is connected', async () => {
      const res = await request(app).get('/api/health');
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toMatchObject({
        status: 'ok',
        database: {
          status: 'connected',
          name: expect.any(String),
          collections: expect.any(Number),
          dataSize: expect.any(Number),
          uptime: expect.any(Number)
        },
        timestamp: expect.any(String)
      });
    });

    it('should return 503 when database is not available', async () => {
      // Disconnect from the test database
      await mongoose.disconnect();
      
      const res = await request(app).get('/api/health');
      
      expect(res.statusCode).toEqual(503);
      expect(res.body).toMatchObject({
        status: 'error',
        error: {
          message: 'Database connection failed',
          details: expect.any(String)
        },
        timestamp: expect.any(String)
      });
      
      // Reconnect for other tests
      await mongoose.connect(process.env.MONGODB_URI);
    });
  });
});
