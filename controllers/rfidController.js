import supabase from '../config/supabase.js';
import { findRFIDByUID, assignRFIDToGuest, getAvailableRFIDs } from '../models/rfidModel.js';
import { findUserById } from '../models/userModel.js';

/**
 * Assign an RFID tag to a guest
 */
export const assignRFID = async (req, res) => {
    try {
        const { guest_id, rfid_tag } = req.body;

        if (!guest_id || !rfid_tag) {
            return res.status(400).json({ message: 'Guest ID and RFID UID are required' });
        }

        // Check if the guest exists
        const { data: guest } = await findUserById(guest_id);
        if (!guest) {
            return res.status(404).json({ message: 'Guest not found' });
        }

        // Check if RFID exists
        const { data: existingRFID } = await findRFIDByUID(rfid_tag);
        if (!existingRFID) {
            return res.status(404).json({ message: 'RFID not found' });
        }

        if (existingRFID.assigned_to) {
            return res.status(400).json({ message: 'RFID is already assigned to another guest' });
        }

        // Assign RFID
        const { data, error } = await assignRFIDToGuest(rfid_tag, guest_id);

        if (error) {
            console.error('Database error:', error);
            return res.status(500).json({ message: 'Database error: Unable to assign RFID' });
        }

        res.status(201).json({ message: 'RFID assigned to guest successfully', data });
    } catch (error) {
        console.error('Unexpected Error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

/**
 * Fetch available RFID tags
 */
export const getAvailableRFIDTags = async (req, res) => {
    try {
        const { data, error } = await getAvailableRFIDs();

        if (error) {
            console.error('Database error:', error);
            return res.status(500).json({ message: 'Database error: Unable to fetch RFID tags' });
        }

        res.status(200).json({ message: 'Available RFID tags fetched successfully', data });
    } catch (error) {
        console.error('Unexpected Error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
