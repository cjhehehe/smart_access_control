import supabase from '../config/supabase.js';
import { saveAccessGranted, saveAccessDenied, getAccessLogs } from '../models/accessLogModel.js';

/**
 * Log Access Granted (Successful Entry)
 */
export const logAccessGranted = async (req, res) => {
    try {
        const { rfid_uid, guest_id } = req.body;

        if (!rfid_uid || !guest_id) {
            return res.status(400).json({ message: 'RFID UID and Guest ID are required' });
        }

        const { data, error } = await saveAccessGranted(rfid_uid, guest_id);

        if (error) {
            console.error('Database error (granted attempt):', error);
            return res.status(500).json({
                message: 'Database error: Unable to log access granted',
                error: error.message
            });
        }

        return res.status(201).json({ message: 'Access granted saved successfully', data });
    } catch (error) {
        console.error('Unexpected Error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

/**
 * Log Access Denied (Failed Entry)
 */
export const logAccessDenied = async (req, res) => {
    try {
        const { rfid_uid } = req.body;

        if (!rfid_uid) {
            return res.status(400).json({ message: 'RFID UID is required' });
        }

        const { data, error } = await saveAccessDenied(rfid_uid);

        if (error) {
            console.error('Database error (denied attempt):', error);
            return res.status(500).json({
                message: 'Database error: Unable to log access denied',
                error: error.message
            });
        }

        return res.status(201).json({ message: 'Access denied saved successfully', data });
    } catch (error) {
        console.error('Unexpected Error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

/**
 * Fetch Access Logs by Guest ID
 */
export const getAccessLogsByGuest = async (req, res) => {
    try {
        const { guest_id } = req.params;
        const { limit = 10, offset = 0 } = req.query;

        if (!guest_id) {
            return res.status(400).json({ message: 'Guest ID is required' });
        }

        const { data, error } = await getAccessLogs(guest_id, parseInt(limit), parseInt(offset));

        if (error) {
            console.error('Database error:', error);
            return res.status(500).json({
                message: 'Database error: Unable to fetch access logs',
                error: error.message
            });
        }

        if (!data || data.length === 0) {
            return res.status(404).json({ message: 'No access logs found for this guest' });
        }

        res.status(200).json({ message: 'Access logs fetched successfully', data });
    } catch (error) {
        console.error('Unexpected Error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
