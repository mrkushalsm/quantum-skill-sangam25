# Armed Forces Welfare Management System

A comprehensive welfare management system designed specifically for armed forces personnel and their families. This system provides digital solutions for welfare schemes, emergency alerts, grievance handling, and community marketplace features.

## 🏗️ System Architecture

### Backend (Node.js/Express)
- RESTful API with comprehensive endpoints
- Real-time communication using Socket.io
- MongoDB for data persistence
- Firebase integration for authentication and storage
- Comprehensive middleware for security and validation

### Frontend (Next.js/React)
- Modern React-based user interface
- Real-time updates and notifications
- Responsive design for all devices
- Progressive Web App capabilities
- Integrated authentication system

## 🚀 Quick Start

### Prerequisites
- Node.js (≥18.0.0)
- npm (≥8.0.0)
- MongoDB (local or cloud)
- Firebase project (for authentication and storage)

### 1. Clone and Setup
```bash
git clone <repository-url>
cd quantum-skill-sangam25

# Install dependencies for both frontend and backend
npm run setup
```

### 2. Environment Configuration

#### Backend Environment (.env)
Create `backend/.env` file:
```env
# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/armed_forces_welfare
DB_NAME=armed_forces_welfare

# Firebase Configuration
FIREBASE_API_KEY=your_firebase_api_key
FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
FIREBASE_MESSAGING_SENDER_ID=your_sender_id
FIREBASE_APP_ID=your_app_id

# Firebase Admin SDK
FIREBASE_PRIVATE_KEY=your_private_key
FIREBASE_CLIENT_EMAIL=your_client_email

# API Configuration
PORT=3001
NODE_ENV=development
JWT_SECRET=your_jwt_secret
```

#### Frontend Environment (.env.local)
```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001

# Firebase Configuration (same as backend)
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### 3. Database Setup
```bash
# Seed initial data
npm run seed

# Create database indexes
cd backend && npm run indexes
```

### 4. Development Mode
```bash
# Start both backend and frontend in development mode
npm run dev
```

This will start:
- Backend API: http://localhost:3001
- Frontend App: http://localhost:3000
- API Documentation: http://localhost:3001/api/docs
- Health Check: http://localhost:3001/health

### 5. Production Mode
```bash
# Build and start in production mode
npm start
```

## 📱 Features

### Core Modules

#### 1. Authentication & Authorization
- Multi-role authentication (Officer, Family, Admin)
- Firebase integration for social login
- JWT-based session management
- Role-based access control

#### 2. Welfare Schemes Management
- Browse available welfare schemes
- Online application submission
- Document upload and verification
- Application status tracking
- Admin approval workflow

#### 3. Emergency Alert System
- Real-time emergency notifications
- GPS-based location sharing
- Severity-based alert classification
- Response coordination
- Emergency contact management

#### 4. Grievance Management
- Online grievance submission
- Category-based classification
- Priority-based handling
- Real-time status updates
- Resolution tracking

#### 5. Community Marketplace
- Peer-to-peer item exchange
- Category-based browsing
- Inquiry system
- Location-based filtering
- Transaction management

#### 6. Dashboard & Analytics
- Role-specific dashboards
- Real-time statistics
- Activity monitoring
- System health indicators
- Notification center

### Technical Features

#### Real-time Communication
- Socket.io integration for live updates
- Real-time notifications
- Emergency alert broadcasting
- Chat functionality for marketplace

#### File Management
- Secure file upload/download
- Multiple file format support
- File size validation
- Cloud storage integration

#### Security Features
- Rate limiting
- Input validation and sanitization
- CORS configuration
- Helmet.js security headers
- Error handling and logging

## 🛠️ Development

### Project Structure
```
quantum-skill-sangam25/
├── backend/                 # Node.js/Express API
│   ├── config/             # Configuration files
│   ├── middleware/         # Express middleware
│   ├── models/            # MongoDB models
│   ├── routes/            # API routes
│   ├── utils/             # Utility functions
│   └── __tests__/         # Test files
├── frontend/              # Next.js application
│   ├── app/              # Next.js 13+ app directory
│   ├── components/       # React components
│   ├── contexts/         # React contexts
│   ├── hooks/           # Custom hooks
│   ├── lib/             # Utility libraries
│   └── public/          # Static assets
└── docs/                # Documentation
```

### Available Scripts

#### Root Level
- `npm run dev` - Start development servers
- `npm start` - Start production servers
- `npm run build` - Build both applications
- `npm test` - Run all tests
- `npm run setup` - Install all dependencies

#### Backend Specific
- `npm run dev` - Development server with hot reload
- `npm run seed` - Populate database with sample data
- `npm run indexes` - Create database indexes
- `npm run backup` - Backup database

#### Frontend Specific
- `npm run dev` - Development server
- `npm run build` - Production build
- `npm run start` - Production server

### Testing
```bash
# Run all tests
npm test

# Backend integration tests
npm run test:integration

# Backend unit tests
cd backend && npm run test:unit

# Frontend tests
cd frontend && npm test
```

### API Documentation
Visit http://localhost:3001/api/docs when the server is running to access interactive API documentation.

## 🔧 Configuration

### Database Configuration
The system uses MongoDB for data persistence. Configure the connection in `backend/config/database.js`.

### Firebase Configuration
Firebase is used for:
- Authentication services
- File storage
- Real-time database features

Configure Firebase in `backend/config/firebase.js` and `frontend/lib/firebase.ts`.

### Socket.io Configuration
Real-time features are powered by Socket.io. Configuration is in `backend/utils/socket.js`.

## 🚨 Troubleshooting

### Common Issues

#### 1. Port Already in Use
```bash
# Kill processes on default ports
npx kill-port 3000 3001
```

#### 2. MongoDB Connection Issues
- Ensure MongoDB is running
- Check connection string in environment variables
- Verify network connectivity

#### 3. Firebase Authentication Issues
- Verify Firebase configuration
- Check API keys and project settings
- Ensure proper domain configuration

#### 4. CORS Issues
- Verify frontend URL in backend CORS configuration
- Check environment variables

## 📊 Monitoring

### Health Checks
- Backend: http://localhost:3001/health
- Real-time status monitoring
- Database connectivity checks

### Logging
- Winston logging for backend
- Console logging for development
- File logging for production

## 🔐 Security

### Security Measures Implemented
- Input validation and sanitization
- Rate limiting
- CORS configuration
- Helmet.js security headers
- JWT token authentication
- Role-based access control
- File upload restrictions

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new features
5. Run the test suite
6. Submit a pull request

## 📄 License

This project is licensed under the ISC License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the GitHub repository
- Contact the development team
- Check the documentation

## 🔄 Version History

- **v1.0.0** - Initial release with core functionality
  - User authentication and authorization
  - Welfare schemes management
  - Emergency alert system
  - Grievance management
  - Community marketplace
  - Real-time notifications

---

**Note**: This system is designed specifically for armed forces welfare management and contains sensitive features. Ensure proper security measures are in place before deployment.
