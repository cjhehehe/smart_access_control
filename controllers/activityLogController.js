// controllers/activityLogsController.js
import {
    saveActivityLog,
    getActivityLogs,
  } from '../models/activityLogModel.js';
  
  /**
   * Create (Log) a Service Request Activity
   */
  export const logServiceRequestActivity = async (req, res) => {
    try {
      const { request_id, admin_id, guest_id, log_type, log_message } = req.body;
  
      if (!request_id || !log_type || !log_message) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: request_id, log_type, log_message',
        });
      }
  
      const { data, error } = await saveActivityLog({
        request_id,
        admin_id,
        guest_id,
        log_type,
        log_message,
      });
  
      if (error) {
        return res.status(500).json({
          success: false,
          message: 'Database error: Unable to log service request activity',
          error: error.message,
        });
      }
  
      return res.status(201).json({
        success: true,
        message: 'Service request log saved successfully',
        data,
      });
    } catch (error) {
      console.error('Unexpected Error in logServiceRequestActivity:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  };
  
  /**
   * Fetch Logs for a Specific Service Request
   */
  export const getServiceRequestLogsForRequest = async (req, res) => {
    try {
      const { request_id } = req.params;
      const { limit = 10, offset = 0 } = req.query;
  
      if (!request_id) {
        return res.status(400).json({
          success: false,
          message: 'request_id is required',
        });
      }
  
      const { data, error } = await getActivityLogs(
        parseInt(request_id),
        parseInt(limit),
        parseInt(offset)
      );
  
      if (error) {
        return res.status(500).json({
          success: false,
          message: 'Database error: Unable to fetch service request logs',
          error: error.message,
        });
      }
      if (!data || data.length === 0) {
        // Return 200 with empty array if no logs
        return res.status(200).json({
          success: true,
          message: 'No logs found for this service request',
          data: [],
        });
      }
  
      return res.status(200).json({
        success: true,
        message: 'Service request logs fetched successfully',
        data,
      });
    } catch (error) {
      console.error('Unexpected Error in getServiceRequestLogsForRequest:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  };
  