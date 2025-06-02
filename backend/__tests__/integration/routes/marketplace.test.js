const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const User = require('../../../models/User');
const MarketplaceListing = require('../../../models/MarketplaceListing');
const marketplaceRoutes = require('../../../routes/marketplace');
const errorHandler = require('../../../middleware/errorHandler');

// Create test app
const createTestApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/marketplace', marketplaceRoutes);
  app.use(errorHandler);
  return app;
};

describe('Marketplace Routes Integration Tests', () => {
  let app;
  let testUser;
  let adminUser;
  let buyerUser;
  let userToken;
  let adminToken;
  let buyerToken;

  beforeEach(async () => {
    app = createTestApp();
    await global.testUtils.cleanDatabase();
    
    // Create test users
    testUser = await global.testUtils.createTestUser();
    adminUser = await global.testUtils.createTestUser({
      email: 'admin@army.mil',
      serviceNumber: 'ADMIN001',
      role: 'admin',
      firebaseUid: 'admin-firebase-uid'
    });
    buyerUser = await global.testUtils.createTestUser({
      email: 'buyer@army.mil',
      serviceNumber: 'BUYER001',
      firebaseUid: 'buyer-firebase-uid'
    });

    // Generate tokens
    userToken = global.testUtils.generateTestToken({
      serviceNumber: testUser.serviceNumber,
      email: testUser.email,
      role: testUser.role
    });

    adminToken = global.testUtils.generateTestToken({
      serviceNumber: adminUser.serviceNumber,
      email: adminUser.email,
      role: adminUser.role
    });

    buyerToken = global.testUtils.generateTestToken({
      serviceNumber: buyerUser.serviceNumber,
      email: buyerUser.email,
      role: buyerUser.role
    });
  });

  describe('POST /marketplace/listings', () => {
    const validListingData = {
      title: 'Test Marketplace Item',
      description: 'This is a test marketplace listing',
      category: 'electronics',
      price: 5000,
      condition: 'excellent',
      location: 'New Delhi',
      contactDetails: {
        phone: '+919876543210',
        email: 'seller@army.mil'
      },
      specifications: {
        brand: 'Test Brand',
        model: 'Test Model',
        year: 2022
      }
    };

    test('should create marketplace listing successfully', async () => {
      const response = await request(app)
        .post('/marketplace/listings')
        .set('Authorization', `Bearer ${userToken}`)
        .send(validListingData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Listing created successfully');
      expect(response.body.data.listing.title).toBe(validListingData.title);
      expect(response.body.data.listing.category).toBe(validListingData.category);
      expect(response.body.data.listing.price).toBe(validListingData.price);
      expect(response.body.data.listing.status).toBe('active');
      expect(response.body.data.listing.sellerId).toBe(testUser._id.toString());
      
      // Verify listing was created in database
      const createdListing = await MarketplaceListing.findOne({ 
        title: validListingData.title,
        sellerId: testUser._id 
      });
      expect(createdListing).toBeTruthy();
      expect(createdListing.status).toBe('active');
    });

    test('should create listing with minimal required data', async () => {
      const minimalData = {
        title: 'Minimal Listing',
        description: 'Minimal description',
        category: 'furniture',
        price: 1000,
        condition: 'good'
      };

      const response = await request(app)
        .post('/marketplace/listings')
        .set('Authorization', `Bearer ${userToken}`)
        .send(minimalData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.listing.title).toBe(minimalData.title);
    });

    test('should fail to create listing without authentication', async () => {
      const response = await request(app)
        .post('/marketplace/listings')
        .send(validListingData);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    test('should fail to create listing with missing required fields', async () => {
      const incompleteData = {
        title: 'Incomplete Listing'
        // Missing description, category, price, condition
      };

      const response = await request(app)
        .post('/marketplace/listings')
        .set('Authorization', `Bearer ${userToken}`)
        .send(incompleteData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('should fail to create listing with invalid category', async () => {
      const invalidData = {
        ...validListingData,
        category: 'invalid-category'
      };

      const response = await request(app)
        .post('/marketplace/listings')
        .set('Authorization', `Bearer ${userToken}`)
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('should fail to create listing with invalid condition', async () => {
      const invalidData = {
        ...validListingData,
        condition: 'invalid-condition'
      };

      const response = await request(app)
        .post('/marketplace/listings')
        .set('Authorization', `Bearer ${userToken}`)
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('should fail to create listing with negative price', async () => {
      const invalidData = {
        ...validListingData,
        price: -100
      };

      const response = await request(app)
        .post('/marketplace/listings')
        .set('Authorization', `Bearer ${userToken}`)
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('should create listing with images', async () => {
      const dataWithImages = {
        ...validListingData,
        images: [
          {
            filename: 'image1.jpg',
            originalName: 'Product Image 1.jpg',
            mimeType: 'image/jpeg',
            size: 2048
          }
        ]
      };

      const response = await request(app)
        .post('/marketplace/listings')
        .set('Authorization', `Bearer ${userToken}`)
        .send(dataWithImages);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.listing.images).toBeInstanceOf(Array);
      expect(response.body.data.listing.images.length).toBe(1);
    });
  });

  describe('GET /marketplace/listings', () => {
    let testListing;

    beforeEach(async () => {
      // Create a test marketplace listing
      testListing = new MarketplaceListing({
        title: 'Test Marketplace Item',
        description: 'Test marketplace description',
        category: 'electronics',
        price: 5000,
        condition: 'excellent',
        status: 'active',
        sellerId: testUser._id,
        location: 'New Delhi'
      });
      await testListing.save();
    });

    test('should get all active marketplace listings', async () => {
      const response = await request(app)
        .get('/marketplace/listings')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.listings).toBeInstanceOf(Array);
      expect(response.body.data.listings.length).toBeGreaterThan(0);
      expect(response.body.data.pagination).toBeDefined();
    });

    test('should filter listings by category', async () => {
      // Create listing with different category
      await new MarketplaceListing({
        title: 'Furniture Item',
        description: 'Test furniture description',
        category: 'furniture',
        price: 3000,
        condition: 'good',
        status: 'active',
        sellerId: testUser._id
      }).save();

      const response = await request(app)
        .get('/marketplace/listings?category=electronics')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.listings.every(listing => listing.category === 'electronics')).toBe(true);
    });

    test('should filter listings by condition', async () => {
      const response = await request(app)
        .get('/marketplace/listings?condition=excellent')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.listings.every(listing => listing.condition === 'excellent')).toBe(true);
    });

    test('should filter listings by price range', async () => {
      const response = await request(app)
        .get('/marketplace/listings?minPrice=1000&maxPrice=10000')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.listings.every(listing => 
        listing.price >= 1000 && listing.price <= 10000
      )).toBe(true);
    });

    test('should search listings by title', async () => {
      const response = await request(app)
        .get('/marketplace/listings?search=Test')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.listings).toBeInstanceOf(Array);
    });

    test('should filter listings by location', async () => {
      const response = await request(app)
        .get('/marketplace/listings?location=New Delhi')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.listings.every(listing => 
        listing.location === 'New Delhi'
      )).toBe(true);
    });

    test('should sort listings by price (low to high)', async () => {
      // Create multiple listings with different prices
      await new MarketplaceListing({
        title: 'Cheap Item',
        description: 'Low price item',
        category: 'electronics',
        price: 1000,
        condition: 'fair',
        status: 'active',
        sellerId: testUser._id
      }).save();

      await new MarketplaceListing({
        title: 'Expensive Item',
        description: 'High price item',
        category: 'electronics',
        price: 10000,
        condition: 'excellent',
        status: 'active',
        sellerId: testUser._id
      }).save();

      const response = await request(app)
        .get('/marketplace/listings?sortBy=price&sortOrder=asc')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      
      const prices = response.body.data.listings.map(listing => listing.price);
      for (let i = 1; i < prices.length; i++) {
        expect(prices[i]).toBeGreaterThanOrEqual(prices[i - 1]);
      }
    });

    test('should paginate results correctly', async () => {
      // Create multiple listings
      for (let i = 0; i < 15; i++) {
        await new MarketplaceListing({
          title: `Test Item ${i}`,
          description: `Test description ${i}`,
          category: 'electronics',
          price: 1000 + i * 100,
          condition: 'good',
          status: 'active',
          sellerId: testUser._id
        }).save();
      }

      const response = await request(app)
        .get('/marketplace/listings?page=1&limit=5')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.listings.length).toBe(5);
      expect(response.body.data.pagination.currentPage).toBe(1);
      expect(response.body.data.pagination.totalPages).toBeGreaterThan(1);
    });

    test('should fail without authentication', async () => {
      const response = await request(app)
        .get('/marketplace/listings');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /marketplace/listings/:id', () => {
    let testListing;

    beforeEach(async () => {
      testListing = new MarketplaceListing({
        title: 'Test Marketplace Item',
        description: 'Test marketplace description',
        category: 'electronics',
        price: 5000,
        condition: 'excellent',
        status: 'active',
        sellerId: testUser._id
      });
      await testListing.save();
    });

    test('should get specific marketplace listing by ID', async () => {
      const response = await request(app)
        .get(`/marketplace/listings/${testListing._id}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.listing._id).toBe(testListing._id.toString());
      expect(response.body.data.listing.title).toBe(testListing.title);
      expect(response.body.data.listing.sellerId).toBeTruthy();
    });

    test('should increment view count when viewing listing', async () => {
      const initialViews = testListing.views || 0;

      const response = await request(app)
        .get(`/marketplace/listings/${testListing._id}`)
        .set('Authorization', `Bearer ${buyerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.listing.views).toBe(initialViews + 1);
    });

    test('should fail for non-existent listing ID', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      
      const response = await request(app)
        .get(`/marketplace/listings/${nonExistentId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Listing not found');
    });

    test('should fail with invalid listing ID format', async () => {
      const response = await request(app)
        .get('/marketplace/listings/invalid-id')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('should fail without authentication', async () => {
      const response = await request(app)
        .get(`/marketplace/listings/${testListing._id}`);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /marketplace/listings/:id', () => {
    let testListing;

    beforeEach(async () => {
      testListing = new MarketplaceListing({
        title: 'Test Marketplace Item',
        description: 'Test marketplace description',
        category: 'electronics',
        price: 5000,
        condition: 'excellent',
        status: 'active',
        sellerId: testUser._id
      });
      await testListing.save();
    });

    const updateData = {
      title: 'Updated Test Item',
      description: 'Updated description',
      price: 4500,
      condition: 'good'
    };

    test('should update own marketplace listing', async () => {
      const response = await request(app)
        .put(`/marketplace/listings/${testListing._id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Listing updated successfully');
      expect(response.body.data.listing.title).toBe(updateData.title);
      expect(response.body.data.listing.price).toBe(updateData.price);
      expect(response.body.data.listing.condition).toBe(updateData.condition);
    });

    test('should allow admin to update any listing', async () => {
      const response = await request(app)
        .put(`/marketplace/listings/${testListing._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.listing.title).toBe(updateData.title);
    });

    test('should fail to update other users listing', async () => {
      const response = await request(app)
        .put(`/marketplace/listings/${testListing._id}`)
        .set('Authorization', `Bearer ${buyerToken}`)
        .send(updateData);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Access denied');
    });

    test('should fail to update non-existent listing', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      
      const response = await request(app)
        .put(`/marketplace/listings/${nonExistentId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(updateData);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    test('should fail to update with invalid data', async () => {
      const invalidData = {
        price: -100, // Invalid negative price
        category: 'invalid-category'
      };

      const response = await request(app)
        .put(`/marketplace/listings/${testListing._id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('should fail without authentication', async () => {
      const response = await request(app)
        .put(`/marketplace/listings/${testListing._id}`)
        .send(updateData);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /marketplace/listings/:id', () => {
    let testListing;

    beforeEach(async () => {
      testListing = new MarketplaceListing({
        title: 'Test Marketplace Item',
        description: 'Test marketplace description',
        category: 'electronics',
        price: 5000,
        condition: 'excellent',
        status: 'active',
        sellerId: testUser._id
      });
      await testListing.save();
    });

    test('should delete own marketplace listing', async () => {
      const response = await request(app)
        .delete(`/marketplace/listings/${testListing._id}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Listing deleted successfully');
      
      // Verify listing was deleted from database
      const deletedListing = await MarketplaceListing.findById(testListing._id);
      expect(deletedListing).toBeNull();
    });

    test('should allow admin to delete any listing', async () => {
      const response = await request(app)
        .delete(`/marketplace/listings/${testListing._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      
      // Verify listing was deleted
      const deletedListing = await MarketplaceListing.findById(testListing._id);
      expect(deletedListing).toBeNull();
    });

    test('should fail to delete other users listing', async () => {
      const response = await request(app)
        .delete(`/marketplace/listings/${testListing._id}`)
        .set('Authorization', `Bearer ${buyerToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Access denied');
    });

    test('should fail to delete non-existent listing', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      
      const response = await request(app)
        .delete(`/marketplace/listings/${nonExistentId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    test('should fail without authentication', async () => {
      const response = await request(app)
        .delete(`/marketplace/listings/${testListing._id}`);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /marketplace/listings/:id/interest', () => {
    let testListing;

    beforeEach(async () => {
      testListing = new MarketplaceListing({
        title: 'Test Marketplace Item',
        description: 'Test marketplace description',
        category: 'electronics',
        price: 5000,
        condition: 'excellent',
        status: 'active',
        sellerId: testUser._id
      });
      await testListing.save();
    });

    test('should express interest in listing', async () => {
      const interestData = {
        message: 'I am interested in purchasing this item'
      };

      const response = await request(app)
        .post(`/marketplace/listings/${testListing._id}/interest`)
        .set('Authorization', `Bearer ${buyerToken}`)
        .send(interestData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Interest expressed successfully');
      expect(response.body.data.interest.buyerId).toBe(buyerUser._id.toString());
      expect(response.body.data.interest.message).toBe(interestData.message);
    });

    test('should fail to express interest in own listing', async () => {
      const interestData = {
        message: 'Cannot buy my own item'
      };

      const response = await request(app)
        .post(`/marketplace/listings/${testListing._id}/interest`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(interestData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Cannot express interest in your own listing');
    });

    test('should fail to express duplicate interest', async () => {
      // First interest
      const interestData = {
        message: 'First interest message'
      };

      await request(app)
        .post(`/marketplace/listings/${testListing._id}/interest`)
        .set('Authorization', `Bearer ${buyerToken}`)
        .send(interestData);

      // Duplicate interest
      const response = await request(app)
        .post(`/marketplace/listings/${testListing._id}/interest`)
        .set('Authorization', `Bearer ${buyerToken}`)
        .send(interestData);

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Interest already expressed');
    });

    test('should fail for non-existent listing', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const interestData = {
        message: 'Interest in non-existent listing'
      };

      const response = await request(app)
        .post(`/marketplace/listings/${nonExistentId}/interest`)
        .set('Authorization', `Bearer ${buyerToken}`)
        .send(interestData);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    test('should fail without authentication', async () => {
      const interestData = {
        message: 'Unauthenticated interest'
      };

      const response = await request(app)
        .post(`/marketplace/listings/${testListing._id}/interest`)
        .send(interestData);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /marketplace/my-listings', () => {
    beforeEach(async () => {
      // Create listings for the test user
      await new MarketplaceListing({
        title: 'My Test Item 1',
        description: 'My first test item',
        category: 'electronics',
        price: 3000,
        condition: 'good',
        status: 'active',
        sellerId: testUser._id
      }).save();

      await new MarketplaceListing({
        title: 'My Test Item 2',
        description: 'My second test item',
        category: 'furniture',
        price: 5000,
        condition: 'excellent',
        status: 'sold',
        sellerId: testUser._id
      }).save();

      // Create listing for another user
      await new MarketplaceListing({
        title: 'Other Users Item',
        description: 'Other users item',
        category: 'electronics',
        price: 2000,
        condition: 'fair',
        status: 'active',
        sellerId: buyerUser._id
      }).save();
    });

    test('should get user own listings', async () => {
      const response = await request(app)
        .get('/marketplace/my-listings')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.listings).toBeInstanceOf(Array);
      expect(response.body.data.listings.length).toBe(2);
      expect(response.body.data.listings.every(listing => 
        listing.sellerId === testUser._id.toString()
      )).toBe(true);
    });

    test('should filter own listings by status', async () => {
      const response = await request(app)
        .get('/marketplace/my-listings?status=active')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.listings.every(listing => listing.status === 'active')).toBe(true);
    });

    test('should fail without authentication', async () => {
      const response = await request(app)
        .get('/marketplace/my-listings');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /marketplace/categories', () => {
    test('should get marketplace categories', async () => {
      const response = await request(app)
        .get('/marketplace/categories')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.categories).toBeInstanceOf(Array);
      expect(response.body.data.categories.length).toBeGreaterThan(0);
      expect(response.body.data.categories).toContain('electronics');
      expect(response.body.data.categories).toContain('furniture');
    });

    test('should fail without authentication', async () => {
      const response = await request(app)
        .get('/marketplace/categories');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /marketplace/statistics', () => {
    beforeEach(async () => {
      // Create test listings for statistics
      await new MarketplaceListing({
        title: 'Electronics Item',
        description: 'Electronics description',
        category: 'electronics',
        price: 5000,
        condition: 'excellent',
        status: 'active',
        sellerId: testUser._id
      }).save();

      await new MarketplaceListing({
        title: 'Furniture Item',
        description: 'Furniture description',
        category: 'furniture',
        price: 3000,
        condition: 'good',
        status: 'sold',
        sellerId: testUser._id
      }).save();
    });

    test('should get marketplace statistics as admin', async () => {
      const response = await request(app)
        .get('/marketplace/statistics')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.statistics).toBeDefined();
      expect(response.body.data.statistics.totalListings).toBeDefined();
      expect(response.body.data.statistics.activeListings).toBeDefined();
      expect(response.body.data.statistics.soldListings).toBeDefined();
      expect(response.body.data.statistics.byCategory).toBeDefined();
      expect(response.body.data.statistics.averagePrice).toBeDefined();
    });

    test('should fail to get statistics as regular user', async () => {
      const response = await request(app)
        .get('/marketplace/statistics')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Access denied. Admin rights required');
    });

    test('should fail without authentication', async () => {
      const response = await request(app)
        .get('/marketplace/statistics');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });
});
