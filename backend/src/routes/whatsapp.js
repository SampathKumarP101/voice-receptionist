/**
 * WhatsApp Routes
 * Webhook endpoints for WhatsApp Business API
 */

const express = require('express');
const router = express.Router();
const whatsappController = require('../controllers/whatsappController');

// Webhook verification (GET) - Meta sends this to verify your endpoint
router.get('/webhook', (req, res) => whatsappController.verifyWebhook(req, res));

// Webhook for receiving messages (POST) - Meta sends messages here
router.post('/webhook', (req, res) => whatsappController.handleWebhook(req, res));

module.exports = router;
