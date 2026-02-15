/**
 * Appointment Routes
 */

const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');

// Appointment endpoints
router.get('/:clinicId', appointmentController.getAppointments.bind(appointmentController));
router.post('/:clinicId', appointmentController.createAppointment.bind(appointmentController));
router.delete('/:id', appointmentController.cancelAppointment.bind(appointmentController));
router.get('/:clinicId/slots', appointmentController.getAvailableSlots.bind(appointmentController));

module.exports = router;
