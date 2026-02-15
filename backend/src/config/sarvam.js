require('dotenv').config();

const axios = require('axios');

const SARVAM_API_KEY = process.env.SARVAM_API_KEY;
const SARVAM_BASE_URL = 'https://api.sarvam.ai';

const sarvamClient = axios.create({
  baseURL: SARVAM_BASE_URL,
  headers: {
    'api-subscription-key': SARVAM_API_KEY,
    'Content-Type': 'application/json'
  }
});

module.exports = {
  sarvamClient,
  SARVAM_API_KEY
};
