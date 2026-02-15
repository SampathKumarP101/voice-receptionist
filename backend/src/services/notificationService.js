/**
 * Notification Service (Exotel)
 * Sends SMS via Exotel
 */

const { exotelClient, exotelPhone } = require('../config/exotel');
const querystring = require('querystring');

class NotificationService {
  /**
   * Send SMS via Exotel
   */
  async sendSMS(to, message) {
    if (!exotelClient) {
      console.warn('Exotel not configured. SMS not sent.');
      return { success: false, reason: 'exotel_not_configured' };
    }

    try {
      const data = querystring.stringify({
        From: exotelPhone,
        To: to,
        Body: message
      });

      const response = await exotelClient.post('/Sms/send', data);

      return {
        success: true,
        messageSid: response.data.SMSMessage?.Sid,
        status: response.data.SMSMessage?.Status
      };
    } catch (error) {
      console.error('Exotel SMS error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Send appointment confirmation
   */
  async sendAppointmentConfirmation(appointment, language = 'en-IN') {
    const message = this._buildConfirmationMessage(appointment, language);
    return await this.sendSMS(appointment.patient_phone, message);
  }

  /**
   * Send appointment reminder
   */
  async sendAppointmentReminder(appointment, language = 'en-IN') {
    const message = this._buildReminderMessage(appointment, language);
    return await this.sendSMS(appointment.patient_phone, message);
  }

  /**
   * Send cancellation confirmation
   */
  async sendCancellationConfirmation(appointment, language = 'en-IN') {
    const message = this._buildCancellationMessage(appointment, language);
    return await this.sendSMS(appointment.patient_phone, message);
  }

  // Build message templates
  _buildConfirmationMessage(appointment, language) {
    if (language === 'kn-IN') {
      return `ನಮಸ್ಕಾರ ${appointment.patient_name},\n\nನಿಮ್ಮ ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್ ನಿಶ್ಚಿತವಾಗಿದೆ:\nದಿನಾಂಕ: ${appointment.appointment_date}\nಸಮಯ: ${appointment.appointment_time}\n\nಧನ್ಯವಾದಗಳು!`;
    } else {
      return `Dear ${appointment.patient_name},\n\nYour appointment is confirmed:\nDate: ${appointment.appointment_date}\nTime: ${appointment.appointment_time}\n\nThank you!`;
    }
  }

  _buildReminderMessage(appointment, language) {
    if (language === 'kn-IN') {
      return `ರಿಮೈಂಡರ್: ${appointment.patient_name}, ನಿಮ್ಮ ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್ ನಾಳೆ ${appointment.appointment_date} ರ ${appointment.appointment_time} ಕ್ಕೆ ಇದೆ.`;
    } else {
      return `Reminder: ${appointment.patient_name}, your appointment is tomorrow ${appointment.appointment_date} at ${appointment.appointment_time}.`;
    }
  }

  _buildCancellationMessage(appointment, language) {
    if (language === 'kn-IN') {
      return `${appointment.patient_name}, ನಿಮ್ಮ ${appointment.appointment_date} ರ ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್ ರದ್ದುಗೊಂಡಿದೆ.`;
    } else {
      return `${appointment.patient_name}, your appointment on ${appointment.appointment_date} has been cancelled.`;
    }
  }
}

module.exports = new NotificationService();
