/**
 * Notification Service
 * Handles sending WhatsApp confirmations and reminders
 */

const whatsappService = require('./whatsappService');

class NotificationService {
  /**
   * Send appointment confirmation via WhatsApp
   */
  async sendAppointmentConfirmation(appointment, clinic, language = 'en') {
    try {
      const params = [
        appointment.patient_name,
        appointment.id.substring(0, 8),
        'General Consultation',
        appointment.appointment_date,
        appointment.appointment_time
      ];

      await whatsappService.sendConfirmationTemplate(
        appointment.patient_phone,
        params,
        language
      );

      console.log(`✓ Confirmation sent to ${appointment.patient_phone}`);
      return { success: true };
    } catch (error) {
      console.error('Error sending confirmation:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send appointment reminder via WhatsApp
   */
  async sendAppointmentReminder(appointment, clinic, language = 'en') {
    try {
      const message = language === 'kn'
        ? `ನಮಸ್ತೆ ${appointment.patient_name},\n\nನಿಮ್ಮ ಅಪಾಯಿಂಟ್ಮೆಂಟ್ ನಾಳೆ ${appointment.appointment_time} ಗೆ ಇದೆ.\n\nಧನ್ಯವಾದಗಳು!`
        : `Hello ${appointment.patient_name},\n\nReminder: Your appointment is tomorrow at ${appointment.appointment_time}.\n\nThank you!`;

      await whatsappService.sendTextMessage(
        appointment.patient_phone,
        message
      );

      console.log(`✓ Reminder sent to ${appointment.patient_phone}`);
      return { success: true };
    } catch (error) {
      console.error('Error sending reminder:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send cancellation confirmation via WhatsApp
   */
  async sendCancellationConfirmation(appointment, language = 'en') {
    try {
      const message = language === 'kn'
        ? `${appointment.patient_name}, ನಿಮ್ಮ ಅಪಾಯಿಂಟ್ಮೆಂಟ್ ರದ್ದುಗೊಳಿಸಲಾಗಿದೆ.`
        : `${appointment.patient_name}, your appointment has been cancelled.`;

      await whatsappService.sendTextMessage(
        appointment.patient_phone,
        message
      );

      return { success: true };
    } catch (error) {
      console.error('Error sending cancellation:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new NotificationService();
