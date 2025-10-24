require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');

// Import middleware
const { errorHandler, notFoundHandler } = require('./middleware/errorMiddleware');

// Import routes
const authRoutes = require('./routes/authRoutes');
const customerRoutes = require('./routes/customerRoutes');
const siteRoutes = require('./routes/siteRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const publicRoutes = require('./routes/public');
// const adminRoutes = require('./routes/adminRoutes'); // TEMPORARILY DISABLED

// Import cron jobs
const { initializeCronJobs } = require('./cron');

// Import real-time monitoring service
const realtimeUptimeService = require('./services/realtimeUptimeService');

// Initialize Express app
const app = express();

// ===== Database Connection =====
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ ERROR: MONGODB_URI is not defined in .env file');
  console.error('Please check your .env file in the project root directory');
  process.exit(1);
}

console.log('📡 Connecting to MongoDB...');
mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('✓ MongoDB connected successfully');
    
    // Start cron jobs after database connection
    if (process.env.NODE_ENV !== 'test') {
      initializeCronJobs();
      
      // Start real-time monitoring (20 second intervals)
      setTimeout(() => {
        realtimeUptimeService.startMonitoringAll();
      }, 5000); // Start after 5 seconds to let server fully initialize
    }
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  });

// ===== Middleware =====

// Security headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS configuration - Allow file:// for widget testing
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, file://)
    if (!origin) return callback(null, true);
    
    // Allow localhost origins
    if (origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1')) {
      return callback(null, true);
    }
    
    // Allow file:// protocol for local testing
    if (origin.startsWith('file://')) {
      return callback(null, true);
    }
    
    // Allow frontend URL
    const allowedOrigins = [process.env.FRONTEND_URL, 'http://localhost:3000'];
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later'
});

app.use('/api/', limiter);

// Serve static files (uploaded payment proofs)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Serve static files (generated bills/invoices)
app.use('/bills', express.static(path.join(__dirname, '../public/bills')));

// Serve widget.js file
app.use('/widget.js', express.static(path.join(__dirname, '../public/widget.js')));

// Serve migration tool
app.use('/migrate-api-keys.html', express.static(path.join(__dirname, '../public/migrate-api-keys.html')));

// Serve API key fix guide
app.use('/api-key-fix.html', express.static(path.join(__dirname, '../public/api-key-fix.html')));

// ===== Routes =====

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/sites', siteRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/public', publicRoutes); // Public routes (no auth required)
// app.use('/api/admin', adminRoutes); // Admin routes for API key management - TEMPORARILY DISABLED

// ===== Error Handling =====
app.use(notFoundHandler);
app.use(errorHandler);

// ===== Start Server =====
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`\n=================================`);
  console.log(`Panaglo Server - ${process.env.NODE_ENV || 'development'} mode`);
  console.log(`Port: ${PORT}`);
  console.log(`=================================\n`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  server.close(() => process.exit(1));
});

module.exports = app;
