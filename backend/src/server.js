/**
 * Main Express Server
 * AI Voice Receptionist Backend
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

// Import routes
const voiceRoutes = require('./routes/voice');
const appointmentRoutes = require('./routes/appointments');
const callLogRoutes = require('./routes/callLogs');

// Import scheduler
const reminderScheduler = require('./jobs/reminderScheduler');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 8001;

// Middleware
app.use(helmet({
  contentSecurityPolicy: false // Allow Twilio webhooks
}));

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    services: {
      database: 'connected',
      exotel: process.env.EXOTEL_ACCOUNT_SID ? 'configured' : 'not configured',
      sarvam: process.env.SARVAM_API_KEY ? 'configured' : 'not configured',
      openai: process.env.OPENAI_API_KEY ? 'configured' : 'not configured'
    }
  });
});

// API Routes
app.use('/api/voice', voiceRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/call-logs', callLogRoutes);

// Welcome route
app.get('/', (req, res) => {
  res.json({
    message: 'AI Voice Receptionist API',
    version: '1.0.0',
    endpoints: {
      voice: '/api/voice',
      appointments: '/api/appointments',
      callLogs: '/api/call-logs',
      health: '/health'
    },
    docs: process.env.BASE_URL + '/api/docs'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log('\n' + '='.repeat(50));
  console.log('🏥 AI Voice Receptionist Backend Server');
  console.log('='.repeat(50));
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📍 Base URL: ${process.env.BASE_URL || `http://localhost:${PORT}`}`);
  console.log('\n🔧 Services Status:');
  console.log(`  • Supabase: ${process.env.SUPABASE_URL ? '✓ Connected' : '✗ Not configured'}`);
  console.log(`  • Exotel: ${process.env.EXOTEL_ACCOUNT_SID ? '✓ Configured' : '⚠ Not configured'}`);
  console.log(`  • Sarvam AI: ${process.env.SARVAM_API_KEY ? '✓ Configured' : '✗ Not configured'}`);
  console.log(`  • OpenAI: ${process.env.OPENAI_API_KEY ? '✓ Configured' : '✗ Not configured'}`);
  console.log('\n📚 API Endpoints:');
  console.log(`  • Voice Webhooks: /api/voice`);
  console.log(`  • Appointments: /api/appointments`);
  console.log(`  • Call Logs: /api/call-logs`);
  console.log(`  • Health Check: /health`);
  console.log('\n' + '='.repeat(50) + '\n');

  // Start reminder scheduler
  reminderScheduler.start();

  if (!process.env.EXOTEL_ACCOUNT_SID) {
    console.log('⚠  WARNING: Exotel not configured. Voice features disabled.');
    console.log('📝 To enable voice features:');
    console.log('  1. Sign up at https://exotel.com');
    console.log('  2. Add EXOTEL_ACCOUNT_SID, EXOTEL_API_KEY, EXOTEL_API_TOKEN to .env');
    console.log('  3. Configure webhook URL in Exotel Dashboard\n');
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('\n🛑 SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\n🛑 SIGINT received. Shutting down gracefully...');
  process.exit(0);
});

module.exports = app;
