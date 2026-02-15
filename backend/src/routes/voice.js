/**
 * Voice Routes (Exotel)
 * Exotel webhook endpoints
 */

const express = require('express');
const router = express.Router();
const voiceController = require('../controllers/voiceController');

// Exotel webhooks
router.post('/incoming-call', voiceController.handleIncomingCall.bind(voiceController));
router.post('/process-input/:CallSid', voiceController.processInput.bind(voiceController));
router.post('/record-name/:CallSid', voiceController.recordName.bind(voiceController));
router.post('/record-date/:CallSid', voiceController.recordDate.bind(voiceController));
router.get('/no-input/:CallSid', voiceController.handleNoInput.bind(voiceController));
router.post('/call-end', voiceController.handleCallEnd.bind(voiceController));

module.exports = router;
