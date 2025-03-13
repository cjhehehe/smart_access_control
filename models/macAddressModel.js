// models/macAddressModel.js
import supabase from '../config/supabase.js';

/**
 * Insert a new MAC record.
 */
export const saveMacAddress = async ({ guest_id, rfid_uid, mac, ip, status }) => {
  try {
    const payload = {
      mac,
      ip,
      status: status || 'pending',
    };
    if (guest_id) payload.guest_id = guest_id;
    if (rfid_uid) payload.rfid_uid = rfid_uid;

    const { data, error } = await supabase
      .from('mac_addresses')
      .insert([payload])
      .select()
      .single();

    if (error) {
      console.error('Error saving MAC:', error);
      return { data: null, error };
    }
    return { data, error: null };
  } catch (err) {
    console.error('Unexpected error in saveMacAddress:', err);
    return { data: null, error: err };
  }
};

/**
 * Get all whitelisted MAC addresses (where status='connected', e.g.).
 */
export const getWhitelistedMacs = async () => {
  try {
    const { data, error } = await supabase
      .from('mac_addresses')
      .select('mac')
      .eq('status', 'connected'); // or 'whitelisted'

    if (error) {
      console.error('Error fetching whitelisted MACs:', error);
      return { data: null, error };
    }
    return { data, error: null };
  } catch (err) {
    console.error('Unexpected error in getWhitelistedMacs:', err);
    return { data: null, error: err };
  }
};

/**
 * Update the status of a MAC record
 */
export const updateMacStatus = async (mac, status) => {
  try {
    const { data, error } = await supabase
      .from('mac_addresses')
      .update({ status })
      .eq('mac', mac)
      .select()
      .single();

    if (error) {
      console.error('Error updating MAC status:', error);
      return { data: null, error };
    }
    if (!data) {
      return { data: null, error: 'MAC not found or no rows updated' };
    }
    return { data, error: null };
  } catch (err) {
    console.error('Unexpected error in updateMacStatus:', err);
    return { data: null, error: err };
  }
};
