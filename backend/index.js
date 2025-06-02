const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { createServer } = require('http');
const { Server } = require('socket.io');
const path = require('path');
require('dotenv').config();

const connectDB = require('./config/database');
const { initializeFirebase } = require('./config/firebase');
const errorHandler = require('./middleware/errorHandler');
const logger = require('./config/logger');
const Scheduler = require('./utils/scheduler');
const { swaggerSetup } = require('./docs/apiDocumentation');

// Route imports
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const dashboardRoutes = require('./routes/dashboard');
const welfareRoutes = require('./routes/welfare');
const emergencyRoutes = require('./routes/emergency');
const marketplaceRoutes = require('./routes/marketplace');
const grievanceRoutes = require('./routes/grievance');

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173", "http://localhost:3001"],
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

const PORT = process.env.PORT || 3001;

// Initialize Firebase
initializeFirebase();

// Connect to MongoDB
connectDB();

// Initialize scheduled tasks
let scheduler;
setTimeout(() => {
  scheduler = new Scheduler(io);
  logger.info('Scheduler initialized');
}, 2000);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  }
});

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS configuration
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', { stream: logger.stream }));
}

// Rate limiting
app.use('/api', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Make io accessible to routes
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Setup API documentation
swaggerSetup(app);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/welfare', welfareRoutes);
app.use('/api/emergency', emergencyRoutes);
app.use('/api/marketplace', marketplaceRoutes);
app.use('/api/grievance', grievanceRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'Armed Forces Welfare System API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    version: '1.0.0'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Armed Forces Welfare Management System API',
    version: '1.0.0',
    documentation: '/api/docs',
    health: '/health'
  });
});

// Socket.io for real-time features
io.on('connection', (socket) => {
  console.log(`🔗 User connected: ${socket.id}`);
  
  // Join user to their personal room
  socket.on('join-user-room', (userId) => {
    socket.join(`user-${userId}`);
    console.log(`User ${userId} joined personal room`);
  });
  
  // Join emergency responders room
  socket.on('join-emergency-room', () => {
    socket.join('emergency-responders');
    console.log('User joined emergency responders room');
  });
  
  // Handle marketplace chat
  socket.on('join-chat', (chatId) => {
    socket.join(`chat-${chatId}`);
  });
  
  socket.on('send-message', (data) => {
    socket.to(`chat-${data.chatId}`).emit('new-message', data);
  });
  
  socket.on('disconnect', () => {
    console.log(`❌ User disconnected: ${socket.id}`);
  });
});

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    success: false, 
    message: `Route ${req.originalUrl} not found` 
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Process terminated');
  });
});

server.listen(PORT, () => {
  logger.info(`🚀 Server running on port ${PORT}`);
  logger.info(`🔥 Environment: ${process.env.NODE_ENV}`);
  logger.info(`🌐 API Base URL: http://localhost:${PORT}/api`);
  logger.info(`📊 Health Check: http://localhost:${PORT}/health`);
  logger.info(`📚 API Documentation: http://localhost:${PORT}/api/docs`);
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🔥 Environment: ${process.env.NODE_ENV}`);
  console.log(`🌐 API Base URL: http://localhost:${PORT}/api`);
  console.log(`📊 Health Check: http://localhost:${PORT}/health`);
  console.log(`📚 API Documentation: http://localhost:${PORT}/api/docs`);
});

module.exports = { app, io };