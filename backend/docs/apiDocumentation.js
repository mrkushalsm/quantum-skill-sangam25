const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Armed Forces Welfare Management System API',
      version: '1.0.0',
      description: 'Comprehensive API for managing welfare schemes, emergency alerts, marketplace, and grievances for Armed Forces personnel and their families.',
      contact: {
        name: 'API Support',
        email: 'support@afwms.gov.in'
      },
      license: {
        name: 'Government of India',
        url: 'https://www.gov.in'
      }
    },
    servers: [
      {
        url: 'http://localhost:3001/api',
        description: 'Development server'
      },
      {
        url: 'https://api.afwms.gov.in/api',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            email: { type: 'string', format: 'email' },
            role: { type: 'string', enum: ['admin', 'officer', 'family_member'] },
            profile: {
              type: 'object',
              properties: {
                firstName: { type: 'string' },
                lastName: { type: 'string' },
                phoneNumber: { type: 'string' },
                serviceNumber: { type: 'string' },
                rank: { type: 'string' },
                unit: { type: 'string' },
                dateOfBirth: { type: 'string', format: 'date' },
                address: { type: 'string' },
                emergencyContact: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    relationship: { type: 'string' },
                    phoneNumber: { type: 'string' }
                  }
                }
              }
            },
            isActive: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        WelfareScheme: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            name: { type: 'string' },
            description: { type: 'string' },
            category: { type: 'string' },
            eligibilityRules: {
              type: 'object',
              properties: {
                ranks: { type: 'array', items: { type: 'string' } },
                serviceYears: { type: 'number' },
                maritalStatus: { type: 'array', items: { type: 'string' } },
                age: {
                  type: 'object',
                  properties: {
                    min: { type: 'number' },
                    max: { type: 'number' }
                  }
                }
              }
            },
            benefits: { type: 'string' },
            applicationDeadline: { type: 'string', format: 'date' },
            requiredDocuments: { type: 'array', items: { type: 'string' } },
            status: { type: 'string', enum: ['active', 'inactive', 'archived'] },
            createdBy: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        Application: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            user: { type: 'string' },
            scheme: { type: 'string' },
            formData: { type: 'object' },
            documents: { type: 'array', items: { type: 'string' } },
            status: { type: 'string', enum: ['draft', 'submitted', 'under_review', 'approved', 'rejected'] },
            submittedAt: { type: 'string', format: 'date-time' },
            reviewNotes: { type: 'string' },
            reviewedBy: { type: 'string' },
            reviewedAt: { type: 'string', format: 'date-time' }
          }
        },
        EmergencyAlert: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            title: { type: 'string' },
            message: { type: 'string' },
            severity: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
            category: { type: 'string' },
            location: {
              type: 'object',
              properties: {
                type: { type: 'string', enum: ['Point'] },
                coordinates: { type: 'array', items: { type: 'number' } },
                address: { type: 'string' }
              }
            },
            affectedArea: { type: 'number' },
            status: { type: 'string', enum: ['active', 'resolved', 'cancelled'] },
            createdBy: { type: 'string' },
            responses: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  user: { type: 'string' },
                  message: { type: 'string' },
                  timestamp: { type: 'string', format: 'date-time' }
                }
              }
            }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: ['./routes/*.js'], // Path to the API routes
};

const specs = swaggerJsdoc(options);

const swaggerSetup = (app) => {
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(specs, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: "AFWMS API Documentation"
  }));
  
  // Serve raw JSON spec
  app.get('/api/docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(specs);
  });
};

module.exports = { swaggerSetup, specs };
