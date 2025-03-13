// models/serviceRequestModel.js
import supabase from '../config/supabase.js';

/**
 * Create a new service request
 */
export const createServiceRequest = async (requestData) => {
  try {
    // Must select 'id' so we get the new row's primary key
    const { data, error } = await supabase
      .from('service_requests')
      .insert([requestData])
      .select(`
        id,
        guest_id,
        guest_name,
        service_type,
        description,
        preferred_time,
        status,
        created_at
      `)
      .single();

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
 * Fetch service requests for a given guest ID
 */
export const getServiceRequestsByGuest = async (guest_id, limit = 10, offset = 0) => {
  try {
    const { data, error } = await supabase
      .from('service_requests')
      .select(`
        id,
        guest_id,
        guest_name,
        service_type,
        description,
        preferred_time,
        status,
        created_at
      `)
      .eq('guest_id', guest_id)
      .order('preferred_time', { ascending: false })
      .range(offset, offset + limit - 1);

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
