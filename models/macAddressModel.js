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

    // Optionally link to a guest or RFID
    if (guest_id) payload.guest_id = guest_id;
    if (rfid_uid) payload.rfid_uid = rfid_uid;

    const { data, error } = await supabase
      .from('mac_addresses')
      .insert([payload])
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (err) {
    console.error('Error saving MAC:', err);
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

    if (error) throw error;
    return { data, error: null };
  } catch (err) {
    console.error('Error fetching whitelisted MACs:', err);
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

    if (error) throw error;
    if (!data) {
      return { data: null, error: 'MAC not found or no rows updated' };
    }
    return { data, error: null };
  } catch (err) {
    console.error('Error updating MAC status:', err);
    return { data: null, error: err };
  }
};
