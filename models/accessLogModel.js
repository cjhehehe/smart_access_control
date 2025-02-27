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
            console.error('Database error:', error);
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
            .select('id, rfid_uid, guest_id, access_status, door_unlocked, timestamp')
            .single();

        if (error) {
            console.error('Database error:', error);
            return { data: null, error };
        }

        return { data };
    } catch (err) {
        console.error('Unexpected error in saveAccessDenied:', err);
        return { data: null, error: err };
    }
};
