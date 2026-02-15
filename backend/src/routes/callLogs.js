/**
 * Call Log Routes
 */

const express = require('express');
const router = express.Router();
const callLogController = require('../controllers/callLogController');

router.get('/:clinicId', callLogController.getCallLogs.bind(callLogController));
router.get('/details/:callSid', callLogController.getCallDetails.bind(callLogController));

module.exports = router;
