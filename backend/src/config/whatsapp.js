/**
 * WhatsApp Business API Configuration
 */

require('dotenv').config();
const axios = require('axios');

const config = {
  appId: process.env.WHATSAPP_APP_ID,
  appSecret: process.env.WHATSAPP_APP_SECRET,
  businessAccountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID,
  phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
  accessToken: process.env.WHATSAPP_ACCESS_TOKEN,
  verifyToken: process.env.WHATSAPP_VERIFY_TOKEN,
  apiVersion: process.env.WHATSAPP_API_VERSION || 'v21.0'
};

// Create axios instance for WhatsApp API
const whatsappClient = axios.create({
  baseURL: `https://graph.facebook.com/${config.apiVersion}`,
  headers: {
    'Authorization': `Bearer ${config.accessToken}`,
    'Content-Type': 'application/json'
  },
  timeout: 15000
});

// Check if WhatsApp is configured
const isConfigured = !!(config.phoneNumberId && config.accessToken);

if (isConfigured) {
  console.log('✓ WhatsApp Business API configured');
} else {
  console.warn('⚠ WhatsApp not configured. Chat features will be disabled.');
}

module.exports = {
  config,
  whatsappClient,
  isConfigured
};
