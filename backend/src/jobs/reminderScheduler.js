/**
 * Reminder Scheduler Job
 * Runs every minute to send scheduled reminders
 */

const cron = require('node-cron');
const supabase = require('../config/database');
const notificationService = require('../services/notificationService');

class ReminderScheduler {
  start() {
    // Run every minute
    cron.schedule('* * * * *', async () => {
      try {
        await this.processReminders();
      } catch (error) {
        console.error('Reminder scheduler error:', error.message);
      }
    });

    console.log('✓ Reminder scheduler started');
  }

  async processReminders() {
    try {
      const now = new Date().toISOString();

      // Get pending reminders due now
      const { data: reminders, error } = await supabase
        .from('reminders')
        .select(`
          *,
          appointments (
            id,
            patient_name,
            patient_phone,
            appointment_date,
            appointment_time,
            language_used
          )
        `)
        .eq('status', 'pending')
        .lte('scheduled_for', now)
        .limit(10);

      if (error) throw error;

      if (!reminders || reminders.length === 0) {
        return;
      }

      console.log(`Processing ${reminders.length} reminders...`);

      for (const reminder of reminders) {
        try {
          const appointment = reminder.appointments;
          
          if (!appointment) {
            await this.markReminderFailed(reminder.id, 'Appointment not found');
            continue;
          }

          // Send reminder
          const result = await notificationService.sendAppointmentReminder(
            appointment,
            appointment.language_used || 'en-IN'
          );

          if (result.success) {
            await this.markReminderSent(reminder.id, result.messageSid);
            console.log(`Reminder sent for appointment ${appointment.id}`);
          } else {
            await this.markReminderFailed(reminder.id, result.error);
          }
        } catch (error) {
          console.error(`Error processing reminder ${reminder.id}:`, error.message);
          await this.markReminderFailed(reminder.id, error.message);
        }
      }
    } catch (error) {
      console.error('Process reminders error:', error.message);
    }
  }

  async markReminderSent(reminderId, messageSid) {
    await supabase
      .from('reminders')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString(),
        message_sid: messageSid
      })
      .eq('id', reminderId);
  }

  async markReminderFailed(reminderId, errorMessage) {
    await supabase
      .from('reminders')
      .update({
        status: 'failed',
        error_message: errorMessage
      })
      .eq('id', reminderId);
  }
}

module.exports = new ReminderScheduler();
