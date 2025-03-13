// controllers/macAddressController.js
import {
    saveMacAddress,
    getWhitelistedMacs,
    updateMacStatus,
  } from '../models/macAddressModel.js';
  
  /**
   * POST /api/mac-address/log
   */
  export const logMacAddress = async (req, res) => {
    try {
      const { guest_id, rfid_uid, mac, ip, status } = req.body;
      if (!mac) {
        return res.status(400).json({ success: false, message: 'MAC is required' });
      }
  
      const { data, error } = await saveMacAddress({ guest_id, rfid_uid, mac, ip, status });
      if (error) {
        return res.status(500).json({
          success: false,
          message: 'Error saving MAC address',
          error,
        });
      }
  
      return res.status(201).json({
        success: true,
        message: 'MAC address logged successfully',
        data,
      });
    } catch (error) {
      console.error('Error logging MAC:', error);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  };
  
  /**
   * GET /api/mac-address/whitelisted
   */
  export const getWhitelistedMacsList = async (req, res) => {
    try {
      const { data, error } = await getWhitelistedMacs();
      if (error) {
        return res.status(500).json({
          success: false,
          message: 'Error fetching whitelisted MACs',
          error,
        });
      }
  
      return res.status(200).json({ success: true, data });
    } catch (error) {
      console.error('Error fetching MACs:', error);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  };
  
  /**
   * POST /api/mac-address/update-status
   */
  export const updateMacAddressStatus = async (req, res) => {
    try {
      const { mac, status } = req.body;
      if (!mac || !status) {
        return res.status(400).json({
          success: false,
          message: 'mac and status are required',
        });
      }
  
      const { data, error } = await updateMacStatus(mac, status);
      if (error) {
        return res.status(500).json({
          success: false,
          message: 'Error updating MAC status',
          error,
        });
      }
  
      return res.status(200).json({
        success: true,
        message: `MAC ${mac} status updated to ${status}`,
        data,
      });
    } catch (error) {
      console.error('Error updating MAC status:', error);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  };
  