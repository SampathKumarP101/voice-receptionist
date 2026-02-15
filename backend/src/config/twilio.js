require('dotenv').config();

const twilio = require('twilio');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhone = process.env.TWILIO_PHONE_NUMBER;
const twilioWhatsApp = process.env.TWILIO_WHATSAPP_NUMBER;

let twilioClient = null;

if (accountSid && authToken) {
  twilioClient = twilio(accountSid, authToken);
  console.log('✓ Twilio client initialized');
} else {
  console.warn('⚠ Twilio credentials not configured. Voice features will be disabled.');
}

const getTwiMLResponse = () => {
  return new twilio.twiml.VoiceResponse();
};

module.exports = {
  twilioClient,
  twilioPhone,
  twilioWhatsApp,
  getTwiMLResponse,
  accountSid,
  authToken
};
