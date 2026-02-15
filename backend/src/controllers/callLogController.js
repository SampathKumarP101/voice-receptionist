/**
 * Call Logs Controller
 */

const supabase = require('../config/database');

class CallLogController {
  async getCallLogs(req, res) {
    try {
      const { clinicId } = req.params;
      const { page = 1, limit = 50 } = req.query;

      const from = (page - 1) * limit;
      const to = from + limit - 1;

      const { data, error, count } = await supabase
        .from('call_logs')
        .select('*', { count: 'exact' })
        .eq('clinic_id', clinicId)
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      res.json({
        success: true,
        callLogs: data,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          totalPages: Math.ceil(count / limit)
        }
      });
    } catch (error) {
      console.error('Get call logs error:', error.message);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async getCallDetails(req, res) {
    try {
      const { callSid } = req.params;

      const { data, error } = await supabase
        .from('call_logs')
        .select('*')
        .eq('call_sid', callSid)
        .single();

      if (error) throw error;

      res.json({
        success: true,
        callLog: data
      });
    } catch (error) {
      console.error('Get call details error:', error.message);
      res.status(500).json({ success: false, error: error.message });
    }
  }
}

module.exports = new CallLogController();
