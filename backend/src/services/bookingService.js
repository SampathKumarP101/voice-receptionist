/**
 * Booking Service
 * Handles appointment logic, availability checking, and conflict detection
 */

const supabase = require('../config/database');

class BookingService {
  /**
   * Check if a slot is available
   * @param {String} clinicId - Clinic UUID
   * @param {String} date - Date in YYYY-MM-DD format
   * @param {String} time - Time in HH:MM format
   * @param {Number} duration - Duration in minutes
   * @returns {Object} - Availability status
   */
  async checkAvailability(clinicId, date, time, duration = 30) {
    try {
      // Parse date and time
      const appointmentDate = new Date(`${date}T${time}:00`);
      const dayOfWeek = appointmentDate.getDay();
      
      // Check if clinic is open on this day
      const { data: slots, error: slotError } = await supabase
        .from('availability_slots')
        .select('*')
        .eq('clinic_id', clinicId)
        .eq('day_of_week', dayOfWeek)
        .eq('is_active', true);

      if (slotError) throw slotError;

      if (!slots || slots.length === 0) {
        return {
          available: false,
          reason: 'clinic_closed',
          message: 'Clinic is closed on this day'
        };
      }

      // Check if time falls within working hours
      const requestedTime = time;
      const isWithinHours = slots.some(slot => {
        return requestedTime >= slot.start_time && requestedTime < slot.end_time;
      });

      if (!isWithinHours) {
        return {
          available: false,
          reason: 'outside_hours',
          message: 'Time is outside clinic working hours',
          workingHours: slots.map(s => `${s.start_time} - ${s.end_time}`)
        };
      }

      // Check for conflicting appointments
      const endTime = this._addMinutes(time, duration);
      
      const { data: conflicts, error: conflictError } = await supabase
        .from('appointments')
        .select('*')
        .eq('clinic_id', clinicId)
        .eq('appointment_date', date)
        .eq('status', 'confirmed')
        .gte('appointment_time', this._addMinutes(time, -duration))
        .lte('appointment_time', endTime);

      if (conflictError) throw conflictError;

      if (conflicts && conflicts.length > 0) {
        return {
          available: false,
          reason: 'slot_booked',
          message: 'This time slot is already booked'
        };
      }

      return {
        available: true,
        message: 'Slot is available'
      };
    } catch (error) {
      console.error('Availability check error:', error.message);
      return {
        available: false,
        reason: 'error',
        message: error.message
      };
    }
  }

  /**
   * Book an appointment
   */
  async createAppointment(appointmentData) {
    try {
      const {
        clinicId,
        patientName,
        patientPhone,
        date,
        time,
        duration = 30,
        languageUsed = 'en-IN',
        createdVia = 'voice',
        notes = ''
      } = appointmentData;

      // Check availability first
      const availability = await this.checkAvailability(clinicId, date, time, duration);
      
      if (!availability.available) {
        return {
          success: false,
          ...availability
        };
      }

      // Create appointment
      const { data, error } = await supabase
        .from('appointments')
        .insert({
          clinic_id: clinicId,
          patient_name: patientName,
          patient_phone: patientPhone,
          appointment_date: date,
          appointment_time: time,
          duration_minutes: duration,
          status: 'confirmed',
          language_used: languageUsed,
          created_via: createdVia,
          notes: notes
        })
        .select()
        .single();

      if (error) throw error;

      // Schedule reminder
      await this._scheduleReminder(data.id);

      return {
        success: true,
        appointment: data,
        message: 'Appointment booked successfully'
      };
    } catch (error) {
      console.error('Booking error:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get available slots for a date
   */
  async getAvailableSlots(clinicId, date) {
    try {
      const appointmentDate = new Date(date);
      const dayOfWeek = appointmentDate.getDay();

      // Get clinic working hours
      const { data: slots, error } = await supabase
        .from('availability_slots')
        .select('*')
        .eq('clinic_id', clinicId)
        .eq('day_of_week', dayOfWeek)
        .eq('is_active', true);

      if (error) throw error;

      if (!slots || slots.length === 0) {
        return {
          success: true,
          availableSlots: [],
          message: 'Clinic closed on this day'
        };
      }

      // Get all booked appointments for this date
      const { data: appointments } = await supabase
        .from('appointments')
        .select('appointment_time, duration_minutes')
        .eq('clinic_id', clinicId)
        .eq('appointment_date', date)
        .eq('status', 'confirmed');

      // Generate all possible slots
      const availableSlots = [];
      
      slots.forEach(slot => {
        const slotDuration = slot.slot_duration_minutes || 30;
        let currentTime = slot.start_time;
        
        while (currentTime < slot.end_time) {
          const isBooked = appointments?.some(apt => apt.appointment_time === currentTime);
          
          if (!isBooked) {
            availableSlots.push(currentTime);
          }
          
          currentTime = this._addMinutes(currentTime, slotDuration);
        }
      });

      return {
        success: true,
        availableSlots: availableSlots.sort(),
        date: date
      };
    } catch (error) {
      console.error('Get slots error:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Cancel appointment
   */
  async cancelAppointment(appointmentId, reason = '') {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          cancellation_reason: reason
        })
        .eq('id', appointmentId)
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        appointment: data,
        message: 'Appointment cancelled successfully'
      };
    } catch (error) {
      console.error('Cancel appointment error:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Find appointment by phone and date
   */
  async findAppointmentByPhone(clinicId, phone, date) {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('clinic_id', clinicId)
        .eq('patient_phone', phone)
        .eq('appointment_date', date)
        .eq('status', 'confirmed')
        .order('appointment_time', { ascending: true })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      return {
        success: true,
        appointment: data || null
      };
    } catch (error) {
      console.error('Find appointment error:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Helper: Add minutes to time string
  _addMinutes(time, minutes) {
    const [hours, mins] = time.split(':').map(Number);
    const totalMinutes = hours * 60 + mins + minutes;
    const newHours = Math.floor(totalMinutes / 60) % 24;
    const newMins = totalMinutes % 60;
    return `${String(newHours).padStart(2, '0')}:${String(newMins).padStart(2, '0')}`;
  }

  // Helper: Schedule reminder
  async _scheduleReminder(appointmentId) {
    try {
      const reminderHours = parseInt(process.env.REMINDER_HOURS_BEFORE || '24');
      
      const { data: appointment } = await supabase
        .from('appointments')
        .select('appointment_date, appointment_time')
        .eq('id', appointmentId)
        .single();

      if (!appointment) return;

      const appointmentDateTime = new Date(`${appointment.appointment_date}T${appointment.appointment_time}:00`);
      const reminderTime = new Date(appointmentDateTime.getTime() - (reminderHours * 60 * 60 * 1000));

      await supabase
        .from('reminders')
        .insert({
          appointment_id: appointmentId,
          reminder_type: 'sms',
          scheduled_for: reminderTime.toISOString(),
          status: 'pending'
        });

      console.log(`Reminder scheduled for ${reminderTime.toISOString()}`);
    } catch (error) {
      console.error('Schedule reminder error:', error.message);
    }
  }
}

module.exports = new BookingService();
