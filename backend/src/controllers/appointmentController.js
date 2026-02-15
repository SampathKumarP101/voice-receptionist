/**
 * Appointment Controller
 * Handles REST API for appointments management
 */

const supabase = require('../config/database');
const bookingService = require('../services/bookingService');
const notificationService = require('../services/notificationService');

class AppointmentController {
  // Get all appointments for a clinic
  async getAppointments(req, res) {
    try {
      const { clinicId } = req.params;
      const { status, date, page = 1, limit = 50 } = req.query;

      let query = supabase
        .from('appointments')
        .select('*', { count: 'exact' })
        .eq('clinic_id', clinicId)
        .order('appointment_date', { ascending: true })
        .order('appointment_time', { ascending: true });

      if (status) {
        query = query.eq('status', status);
      }

      if (date) {
        query = query.eq('appointment_date', date);
      }

      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;

      res.json({
        success: true,
        appointments: data,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          totalPages: Math.ceil(count / limit)
        }
      });
    } catch (error) {
      console.error('Get appointments error:', error.message);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // Create appointment manually
  async createAppointment(req, res) {
    try {
      const { clinicId } = req.params;
      const { patientName, patientPhone, date, time, notes } = req.body;

      const result = await bookingService.createAppointment({
        clinicId,
        patientName,
        patientPhone,
        date,
        time,
        createdVia: 'dashboard',
        notes
      });

      if (!result.success) {
        return res.status(400).json(result);
      }

      // Send confirmation
      await notificationService.sendAppointmentConfirmation(
        result.appointment,
        'sms'
      );

      res.json(result);
    } catch (error) {
      console.error('Create appointment error:', error.message);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // Cancel appointment
  async cancelAppointment(req, res) {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      const result = await bookingService.cancelAppointment(id, reason);

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.json(result);
    } catch (error) {
      console.error('Cancel appointment error:', error.message);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  // Get available slots
  async getAvailableSlots(req, res) {
    try {
      const { clinicId } = req.params;
      const { date } = req.query;

      if (!date) {
        return res.status(400).json({ 
          success: false, 
          error: 'Date parameter required' 
        });
      }

      const result = await bookingService.getAvailableSlots(clinicId, date);
      res.json(result);
    } catch (error) {
      console.error('Get slots error:', error.message);
      res.status(500).json({ success: false, error: error.message });
    }
  }
}

module.exports = new AppointmentController();
