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
const whatsappRoutes = require('./routes/whatsapp');
const appointmentRoutes = require('./routes/appointments');

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
      whatsapp: process.env.WHATSAPP_PHONE_NUMBER_ID ? 'configured' : 'not configured',
      exotel: process.env.EXOTEL_ACCOUNT_SID ? 'configured (deprecated)' : 'not configured',
      openai: process.env.OPENAI_API_KEY ? 'configured' : 'not configured'
    }
  });
});

// API Routes
app.use('/api/whatsapp', whatsappRoutes);
app.use('/api/appointments', appointmentRoutes);

// Welcome route
app.get('/', (req, res) => {
  res.json({
    message: 'AI WhatsApp Receptionist API',
    version: '2.0.0',
    endpoints: {
      whatsapp: '/api/whatsapp/webhook',
      appointments: '/api/appointments',
      health: '/health'
    }
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
  console.log('🏥 AI Receptionist Backend Server (WhatsApp + Voice)');
  console.log('='.repeat(50));
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📍 Base URL: ${process.env.BASE_URL || `http://localhost:${PORT}`}`);
  console.log('\n🔧 Services Status:');
  console.log(`  • Supabase: ${process.env.SUPABASE_URL ? '✓ Connected' : '✗ Not configured'}`);
  console.log(`  • WhatsApp: ${process.env.WHATSAPP_PHONE_NUMBER_ID ? '✓ Configured' : '⚠ Not configured'}`);
  console.log(`  • OpenAI: ${process.env.OPENAI_API_KEY ? '✓ Configured' : '✗ Not configured'}`);
  console.log('\n📚 API Endpoints:');
  console.log(`  • WhatsApp Webhooks: /api/whatsapp/webhook`);
  console.log(`  • Appointments: /api/appointments`);
  console.log(`  • Health Check: /health`);
  console.log('\n' + '='.repeat(50) + '\n');

  // Start reminder scheduler
  reminderScheduler.start();

  if (!process.env.WHATSAPP_PHONE_NUMBER_ID) {
    console.log('⚠  WARNING: WhatsApp not configured. Chat features disabled.');
    console.log('📝 To enable WhatsApp:');
    console.log('  1. Add WHATSAPP_PHONE_NUMBER_ID and WHATSAPP_ACCESS_TOKEN to .env');
    console.log('  2. Configure webhook URL in Meta App Dashboard\n');
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
