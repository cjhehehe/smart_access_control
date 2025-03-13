// controllers/accessLogsController.js
import {
    saveAccessGranted,
    saveAccessDenied,
    getAccessLogs,
  } from '../models/accessLogModel.js';
  
  /**
   * Log Access Granted
   */
  export const logAccessGranted = async (req, res) => {
    try {
      const { rfid_uid, guest_id } = req.body;
      if (!rfid_uid || !guest_id) {
        return res.status(400).json({
          success: false,
          message: 'RFID UID and Guest ID are required',
        });
      }
  
      const { data, error } = await saveAccessGranted(rfid_uid, guest_id);
      if (error) {
        return res.status(500).json({
          success: false,
          message: 'Database error: Unable to log access granted',
          error: error.message,
        });
      }
      return res
        .status(201)
        .json({ success: true, message: 'Access granted saved successfully', data });
    } catch (error) {
      console.error('Unexpected Error in logAccessGranted:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  };
  
  /**
   * Log Access Denied
   */
  export const logAccessDenied = async (req, res) => {
    try {
      const { rfid_uid } = req.body;
      if (!rfid_uid) {
        return res.status(400).json({
          success: false,
          message: 'RFID UID is required',
        });
      }
  
      const { data, error } = await saveAccessDenied(rfid_uid);
      if (error) {
        return res.status(500).json({
          success: false,
          message: 'Database error: Unable to log access denied',
          error: error.message,
        });
      }
      return res
        .status(201)
        .json({ success: true, message: 'Access denied saved successfully', data });
    } catch (error) {
      console.error('Unexpected Error in logAccessDenied:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  };
  
  /**
   * Get Access Logs for a Guest
   */
  export const getAccessLogsByGuest = async (req, res) => {
    try {
      const { guest_id } = req.params;
      const { limit = 10, offset = 0 } = req.query;
  
      if (!guest_id) {
        return res.status(400).json({
          success: false,
          message: 'Guest ID is required',
        });
      }
  
      const { data, error } = await getAccessLogs(
        guest_id,
        parseInt(limit),
        parseInt(offset)
      );
      if (error) {
        return res.status(500).json({
          success: false,
          message: 'Database error: Unable to fetch access logs',
          error: error.message,
        });
      }
      if (!data || data.length === 0) {
        // Return 200 with an empty array for "no logs found"
        return res.status(200).json({
          success: true,
          message: 'No access logs found for this guest',
          data: [],
        });
      }
  
      res.status(200).json({
        success: true,
        message: 'Access logs fetched successfully',
        data,
      });
    } catch (error) {
      console.error('Unexpected Error in getAccessLogsByGuest:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  };
  