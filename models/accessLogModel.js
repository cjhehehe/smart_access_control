import supabase from '../config/supabase.js';

/**
 * Log Access Granted (Successful Entry)
 */
export const saveAccessGranted = async (rfid_uid, guest_id) => {
    try {
        const { data, error } = await supabase
            .from('access_logs')
            .insert([
                {
                    rfid_uid,
                    guest_id,
                    access_status: "granted",
                    door_unlocked: true,
                    timestamp: new Date().toISOString(),
                }
            ])
            .select('id, rfid_uid, guest_id, access_status, door_unlocked, timestamp')
            .single();

        if (error) {
            console.error('Database error (saving access granted):', error);
            return { data: null, error };
        }

        return { data };
    } catch (err) {
        console.error('Unexpected error in saveAccessGranted:', err);
        return { data: null, error: err };
    }
};

/**
 * Log Access Denied (Failed Entry)
 */
export const saveAccessDenied = async (rfid_uid) => {
    try {
        const { data, error } = await supabase
            .from('access_logs')
            .insert([
                {
                    rfid_uid,
                    guest_id: null,  // No guest assigned
                    access_status: "denied",
                    door_unlocked: false,
                    timestamp: new Date().toISOString(),
                }
            ])
            .select('id, rfid_uid, access_status, door_unlocked, timestamp')
            .single();

        if (error) {
            console.error('Database error (saving access denied):', error);
            return { data: null, error };
        }

        return { data };
    } catch (err) {
        console.error('Unexpected error in saveAccessDenied:', err);
        return { data: null, error: err };
    }
};

/**
 * Fetch Access Logs for a Given Guest ID
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
            console.error('Database error (fetching access logs):', error);
            return { data: null, error };
        }

        return { data };
    } catch (err) {
        console.error('Unexpected error in getAccessLogs:', err);
        return { data: null, error: err };
    }
};
