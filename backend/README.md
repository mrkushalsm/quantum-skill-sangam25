# Armed Forces Welfare Management System - Backend

A comprehensive backend system for managing welfare schemes, emergency alerts, marketplace, and grievances for Armed Forces personnel and their families.

## 🚀 Features

### Core Functionality
- **User Management**: Role-based access control (Admin, Officer, Family Member)
- **Welfare Schemes**: Complete lifecycle management of welfare schemes
- **Emergency Alerts**: Real-time emergency notification system
- **Marketplace**: Buy/sell platform for armed forces community
- **Grievance System**: Ticket-based grievance handling with escalation
- **Real-time Communication**: Socket.io powered notifications and chat

### Technical Features
- **Authentication**: Firebase Admin SDK integration
- **Database**: MongoDB with optimized indexes
- **File Upload**: Secure file handling with validation
- **Real-time**: Socket.io for live updates
- **Logging**: Winston-based comprehensive logging
- **Scheduling**: Automated tasks and reminders
- **API Documentation**: Swagger/OpenAPI integration
- **Backup/Restore**: Database backup and recovery tools

## 📋 Prerequisites

- Node.js (v16.0.0 or higher)
- MongoDB (v5.0 or higher)
- Firebase project with Admin SDK
- npm or yarn package manager

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/armed-forces-welfare.git
   cd armed-forces-welfare/backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` file with your configuration:
   - MongoDB connection string
   - Firebase Admin SDK credentials
   - Email/SMS service credentials
   - JWT secrets and other settings

4. **Database Setup**
   ```bash
   # Create database indexes
   npm run indexes
   
   # Seed initial data (optional)
   npm run seed
   ```

## 🚀 Running the Application

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

### Using Docker
```bash
# Build and run with Docker Compose
docker-compose up -d

# Or build individual container
docker build -t armed-forces-welfare-api .
docker run -p 3001:3001 armed-forces-welfare-api
```

### Using PM2 (Production)
```bash
# Install PM2 globally
npm install -g pm2

# Start with ecosystem file
pm2 start ecosystem.config.js --env production

# Monitor processes
pm2 monit

# View logs
pm2 logs
```

## 📚 API Documentation

Once the server is running, access the API documentation at:
- **Swagger UI**: `http://localhost:3001/api/docs`
- **JSON Spec**: `http://localhost:3001/api/docs.json`

## 🔧 Available Scripts

### Development
- `npm run dev` - Start development server with hot reload
- `npm run seed` - Populate database with sample data
- `npm run indexes` - Create database indexes

### Database Management
- `npm run backup create` - Create database backup
- `npm run backup restore <path>` - Restore from backup
- `npm run backup list` - List available backups

### Code Quality
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

## 🏗️ Project Structure

```
backend/
├── config/                 # Configuration files
│   ├── database.js         # MongoDB connection
│   ├── firebase.js         # Firebase Admin setup
│   └── logger.js          # Winston logger config
├── docs/                   # API documentation
│   └── apiDocumentation.js # Swagger configuration
├── middleware/             # Express middleware
│   ├── auth.js            # Authentication middleware
│   ├── errorHandler.js    # Global error handling
│   ├── upload.js          # File upload handling
│   └── validation.js      # Request validation
├── models/                 # Mongoose schemas
│   ├── User.js            # User model
│   ├── WelfareScheme.js   # Welfare scheme model
│   ├── Application.js     # Application model
│   ├── EmergencyAlert.js  # Emergency alert model
│   ├── MarketplaceItem.js # Marketplace item model
│   ├── Grievance.js       # Grievance model
│   ├── Message.js         # Message model
│   └── Notification.js    # Notification model
├── routes/                 # API routes
│   ├── auth.js            # Authentication routes
│   ├── users.js           # User management
│   ├── dashboard.js       # Dashboard data
│   ├── welfare.js         # Welfare schemes
│   ├── emergency.js       # Emergency alerts
│   ├── marketplace.js     # Marketplace
│   └── grievance.js       # Grievance system
├── scripts/                # Utility scripts
│   ├── seedData.js        # Database seeding
│   ├── createIndexes.js   # Index creation
│   └── backup.js          # Backup/restore
├── utils/                  # Utility functions
│   ├── notification.js    # Notification system
│   ├── scheduler.js       # Scheduled tasks
│   └── socket.js          # Socket.io handling
├── uploads/                # File storage
└── logs/                   # Application logs
```

## 🔐 Authentication

The system uses Firebase Authentication with role-based access:

### Roles
- **Admin**: Full system access
- **Officer**: Military personnel with extended privileges
- **Family Member**: Limited access to relevant features

### API Authentication
Include Firebase ID token in requests:
```bash
Authorization: Bearer <firebase_id_token>
```

## 🌐 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update profile

### Welfare Schemes
- `GET /api/welfare/schemes` - List schemes
- `POST /api/welfare/schemes` - Create scheme (Admin)
- `GET /api/welfare/schemes/:id` - Get scheme details
- `POST /api/welfare/apply/:id` - Apply for scheme

### Emergency Alerts
- `GET /api/emergency/alerts` - List alerts
- `POST /api/emergency/alerts` - Create alert
- `POST /api/emergency/alerts/:id/respond` - Respond to alert

### Marketplace
- `GET /api/marketplace/items` - List items
- `POST /api/marketplace/items` - Create item
- `POST /api/marketplace/items/:id/inquiry` - Send inquiry

### Grievances
- `GET /api/grievance/tickets` - List grievances
- `POST /api/grievance/tickets` - Create grievance
- `PUT /api/grievance/tickets/:id` - Update grievance

## 🔄 Real-time Features

### Socket.io Events

#### Client to Server
- `join-user-room` - Join personal notification room
- `join-emergency-room` - Join emergency responders room
- `join-chat` - Join marketplace chat
- `send-message` - Send chat message

#### Server to Client
- `new-notification` - New notification received
- `emergency-alert` - New emergency alert
- `new-message` - New chat message
- `scheme-update` - Welfare scheme update

## 📊 Monitoring & Logging

### Log Files
- `logs/combined.log` - All logs
- `logs/error.log` - Error logs only
- `logs/debug.log` - Debug information

### Health Check
- `GET /health` - Application health status

### Monitoring Endpoints
- `GET /` - API information
- `GET /api/docs` - API documentation

## 🛡️ Security Features

- **Helmet.js**: Security headers
- **Rate Limiting**: Request throttling
- **CORS**: Cross-origin protection
- **Input Validation**: Joi schema validation
- **File Upload Security**: Type and size validation
- **Firebase Authentication**: Secure token verification

## 🔧 Configuration

### Environment Variables

Key environment variables to configure:

```env
# Server
NODE_ENV=production
PORT=3001

# Database
MONGODB_URI=mongodb://localhost:27017/armed_forces_welfare

# Firebase
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_CLIENT_EMAIL=your-client-email

# Security
JWT_SECRET=your-jwt-secret
RATE_LIMIT_MAX_REQUESTS=100

# Email/SMS
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
```

## 🚀 Deployment

### Production Deployment

1. **Prepare Environment**
   ```bash
   npm ci --only=production
   npm run indexes
   ```

2. **Using PM2**
   ```bash
   pm2 start ecosystem.config.js --env production
   ```

3. **Using Docker**
   ```bash
   docker-compose -f docker-compose.yml up -d
   ```

4. **Environment Setup**
   - Configure production environment variables
   - Set up SSL certificates
   - Configure firewall rules
   - Set up monitoring and alerting

### Scaling Considerations

- Use MongoDB replica sets for high availability
- Implement Redis for session storage and caching
- Use load balancers for multiple instances
- Configure CDN for static file delivery
- Set up monitoring with tools like New Relic or DataDog

## 🧪 Testing

```bash
# Run tests (when implemented)
npm test

# Run linting
npm run lint

# Format code
npm run format
```

## 📈 Performance Optimization

### Database
- Optimized indexes for common queries
- Aggregation pipelines for complex operations
- Connection pooling for efficiency

### Caching
- Redis integration ready
- In-memory caching for frequently accessed data
- File system caching for uploads

### Monitoring
- Winston logging with log rotation
- Performance metrics collection
- Error tracking and alerting

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Run linting and formatting
6. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact: support@afwms.gov.in
- Documentation: `/api/docs`

## 🔄 Version History

### v1.0.0
- Initial release
- Complete welfare management system
- Real-time emergency alerts
- Marketplace functionality
- Grievance management system
