require('dotenv').config();

const axios = require('axios');

const accountSid = process.env.EXOTEL_ACCOUNT_SID;
const apiKey = process.env.EXOTEL_API_KEY;
const apiToken = process.env.EXOTEL_API_TOKEN;
const subdomain = process.env.EXOTEL_SUBDOMAIN || 'api';
const exotelPhone = process.env.EXOTEL_PHONE_NUMBER;

let exotelClient = null;

if (accountSid && apiKey && apiToken) {
  // Create axios instance with Basic Auth
  exotelClient = axios.create({
    baseURL: `https://${subdomain}.exotel.com/v1/Accounts/${accountSid}`,
    auth: {
      username: apiKey,
      password: apiToken
    },
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  });
  
  console.log('✓ Exotel client initialized');
} else {
  console.warn('⚠ Exotel credentials not configured. Voice features will be disabled.');
}

/**
 * Generate ExoML (Exotel Markup Language) response
 * Similar to TwiML but for Exotel
 */
class ExoMLResponse {
  constructor() {
    this.elements = [];
  }

  say(text, options = {}) {
    const voice = options.voice || 'female';
    const language = options.language || 'en';
    this.elements.push(`  <Say voice="${voice}" language="${language}">${this._escape(text)}</Say>`);
    return this;
  }

  gather(options = {}) {
    const numDigits = options.numDigits || 1;
    const action = options.action || '';
    const method = options.method || 'POST';
    const timeout = options.timeout || 5;
    
    let gatherXml = `  <Gather NumDigits="${numDigits}" Action="${action}" Method="${method}" Timeout="${timeout}">`;
    
    if (options.say) {
      gatherXml += `\n    <Say>${this._escape(options.say)}</Say>`;
    }
    
    gatherXml += '\n  </Gather>';
    this.elements.push(gatherXml);
    return this;
  }

  dial(number, options = {}) {
    this.elements.push(`  <Dial>${number}</Dial>`);
    return this;
  }

  hangup() {
    this.elements.push('  <Hangup/>');
    return this;
  }

  redirect(url) {
    this.elements.push(`  <Redirect>${url}</Redirect>`);
    return this;
  }

  play(url) {
    this.elements.push(`  <Play>${url}</Play>`);
    return this;
  }

  record(options = {}) {
    const maxLength = options.maxLength || 60;
    const finishOnKey = options.finishOnKey || '#';
    this.elements.push(`  <Record MaxLength="${maxLength}" FinishOnKey="${finishOnKey}"/>`);
    return this;
  }

  toString() {
    return `<?xml version="1.0" encoding="UTF-8"?>\n<Response>\n${this.elements.join('\n')}\n</Response>`;
  }

  _escape(text) {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}

const getExoMLResponse = () => {
  return new ExoMLResponse();
};

module.exports = {
  exotelClient,
  exotelPhone,
  accountSid,
  apiKey,
  apiToken,
  subdomain,
  getExoMLResponse
};
