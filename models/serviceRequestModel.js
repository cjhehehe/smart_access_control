import supabase from '../config/supabase.js';

/**
 * Create a new service request (Optimized)
 */
export const createServiceRequest = async (requestData) => {
    try {
        const { data, error } = await supabase
            .from('service_requests')
            .insert([requestData])
            .select('id, guest_id, service_type, description, preferred_time, status, created_at')
            .single(); // Fetch only required fields

        if (error) {
            console.error('Supabase Insert Error:', error.message);
            return { data: null, error };
        }

        return { data };
    } catch (err) {
        console.error('Unexpected error in createServiceRequest:', err);
        return { data: null, error: err };
    }
};

/**
 * Fetch service requests for a given guest ID (Optimized)
 */
export const getServiceRequestsByGuest = async (guest_id, limit = 10, offset = 0) => {
    try {
        const { data, error } = await supabase
            .from('service_requests')
            .select('id, guest_id, service_type, description, preferred_time, status, created_at')
            .eq('guest_id', guest_id)
            .order('preferred_time', { ascending: false }) // Show most recent requests first
            .range(offset, offset + limit - 1); // Pagination

        if (error) {
            console.error('Database error:', error);
            return { data: null, error };
        }

        return { data };
    } catch (err) {
        console.error('Unexpected error in getServiceRequestsByGuest:', err);
        return { data: null, error: err };
    }
};
