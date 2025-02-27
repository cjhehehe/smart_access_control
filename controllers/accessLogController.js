import supabase from '../config/supabase.js';
import { logAccess, getAccessLogs } from '../models/accessLogModel.js';

/**
 * Log an access attempt when an RFID is scanned (Optimized)
 */
export const logAccessAttempt = async (req, res) => {
    try {
        const { rfid_uid, access_status, door_unlocked } = req.body;

        if (!rfid_uid || !access_status) {
            return res.status(400).json({ message: 'RFID UID and access status are required' });
        }

        // Fetch RFID and assigned guest in a single query (Optimized)
        const { data: rfidTag, error: rfidError } = await supabase
            .from('rfid_tags')
            .select('id, assigned_to')
            .eq('rfid_uid', rfid_uid)
            .maybeSingle(); // Prevents error if no data is found

        // If no assigned guest, log a denied attempt anyway
        if (!rfidTag?.assigned_to) {
            // Log the denied attempt with guest_id = null
            const { data: logData, error: logError } = await logAccess(
                rfid_uid,
                null, // No guest ID
                'denied',
                false
            );

            if (logError) {
                console.error('Database error (denied attempt):', logError);
                return res.status(500).json({
                    message: 'Database error: Unable to log denied attempt',
                    error: logError.message
                });
            }

            // Return 403 or 404 to indicate invalid/unassigned RFID
            // (Choose whichever fits your logic; 403 = forbidden)
            return res.status(403).json({
                message: 'Access denied. RFID tag not found or not assigned to any guest',
                data: logData
            });
        }

        // If we reach here, the RFID is valid and assigned
        const { data, error } = await logAccess(rfid_uid, rfidTag.assigned_to, access_status, door_unlocked);

        if (error) {
            console.error('Database error:', error);
            return res.status(500).json({
                message: 'Database error: Unable to log access attempt',
                error: error.message
            });
        }

        // Return success
        res.status(201).json({ message: 'Access attempt logged successfully', data });
    } catch (error) {
        console.error('Unexpected Error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

/**
 * Fetch access logs by guest ID (Optimized)
 */
export const getAccessLogsByGuest = async (req, res) => {
    try {
        const { guest_id } = req.params;
        const { limit = 10, offset = 0 } = req.query; // Pagination support

        if (!guest_id) {
            return res.status(400).json({ message: 'Guest ID is required' });
        }

        // Retrieve access logs with pagination
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
