import supabase from '../config/supabase.js';

/**
 * Log an access attempt (Optimized)
 */
export const logAccess = async (rfid_uid, guest_id, access_status, door_unlocked = false) => {
    try {
        const { data, error } = await supabase
            .from('access_logs')
            .insert([
                {
                    rfid_uid,
                    guest_id,
                    access_status,
                    door_unlocked,
                    timestamp: new Date().toISOString(),
                }
            ])
            .select('id, rfid_uid, guest_id, access_status, door_unlocked, timestamp') // Select only required fields
            .single();

        if (error) {
            console.error('Database error:', error);
            return { data: null, error };
        }

        return { data };
    } catch (err) {
        console.error('Unexpected error in logAccess:', err);
        return { data: null, error: err };
    }
};

/**
 * Fetch access logs for a given guest ID (Optimized)
 */
export const getAccessLogs = async (guest_id, limit = 10, offset = 0) => {
    try {
        const { data, error } = await supabase
            .from('access_logs')
            .select('id, rfid_uid, guest_id, access_status, door_unlocked, timestamp')
            .eq('guest_id', guest_id)
            .order('timestamp', { ascending: false })
            .range(offset, offset + limit - 1); // Efficient pagination

        if (error) {
            console.error('Database error:', error);
            return { data: null, error };
        }

        return { data };
    } catch (err) {
        console.error('Unexpected error in getAccessLogs:', err);
        return { data: null, error: err };
    }
};
