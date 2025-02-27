import supabase from '../config/supabase.js';

/**
 * Find RFID by UID (Optimized)
 */
export const findRFIDByUID = async (rfid_uid) => {
    try {
        const { data, error } = await supabase
            .from('rfid_tags')
            .select('id, rfid_uid, assigned_to, status')
            .eq('rfid_uid', rfid_uid)
            .limit(1) // Optimize for performance
            .maybeSingle(); // Prevent errors if no result found

        if (error) {
            console.error('Error finding RFID:', error);
            return { data: null, error };
        }
        return { data };
    } catch (err) {
        console.error('Unexpected error in findRFIDByUID:', err);
        return { data: null, error: err };
    }
};

/**
 * Assign RFID to Guest (Atomic Update)
 */
export const assignRFIDToGuest = async (rfid_uid, guest_id) => {
    try {
        const { data, error } = await supabase
            .from('rfid_tags')
            .update({ assigned_to: guest_id, status: 'active' })
            .eq('rfid_uid', rfid_uid)
            .is('assigned_to', null) // Prevent duplicate assignment (Atomic Update)
            .select('id, rfid_uid, assigned_to, status') // Fetch only necessary fields
            .single();

        if (error) {
            console.error('Error assigning RFID:', error);
            return { data: null, error };
        }
        return { data };
    } catch (err) {
        console.error('Unexpected error in assignRFIDToGuest:', err);
        return { data: null, error: err };
    }
};

/**
 * Fetch available RFID tags (Optimized Query)
 */
export const getAvailableRFIDs = async () => {
    try {
        const { data, error } = await supabase
            .from('rfid_tags')
            .select('id, rfid_uid, status') // Fetch only necessary fields
            .is('assigned_to', null);

        if (error) {
            console.error('Error fetching available RFID tags:', error);
            return { data: null, error };
        }
        return { data };
    } catch (err) {
        console.error('Unexpected error in getAvailableRFIDs:', err);
        return { data: null, error: err };
    }
};
