// models/rfidModel.js
import supabase from '../config/supabase.js';

/**
 * Find an RFID by its UID (rfid_uid).
 */
export const findRFIDByUID = async (rfid_uid) => {
  try {
    const { data, error } = await supabase
      .from('rfid_tags')
      .select('id, rfid_uid, guest_id, guest_name, status')
      .eq('rfid_uid', rfid_uid)
      .maybeSingle();

    if (error) {
      console.error('Error finding RFID:', error);
      return { data: null, error };
    }
    return { data, error: null };
  } catch (err) {
    console.error('Unexpected error in findRFIDByUID:', err);
    return { data: null, error: err };
  }
};

/**
 * Fetch ALL RFID tags (for admin dashboards, etc.).
 */
export const getAllRFIDs = async () => {
  try {
    const { data, error } = await supabase
      .from('rfid_tags')
      .select('*'); // or specify columns if you want to limit the fields

    if (error) {
      console.error('Error fetching all RFID tags:', error);
      return { data: null, error };
    }
    return { data, error: null };
  } catch (err) {
    console.error('Unexpected error in getAllRFIDs:', err);
    return { data: null, error: err };
  }
};

/**
 * Fetch only RFID tags that are truly 'available'.
 */
export const getAvailableRFIDs = async () => {
  try {
    // If you prefer to check guest_id == null, you can do .is('guest_id', null),
    // but we strongly recommend using the 'status' column to keep it consistent.
    const { data, error } = await supabase
      .from('rfid_tags')
      .select('id, rfid_uid, status')
      .eq('status', 'available');

    if (error) {
      console.error('Error fetching available RFID tags:', error);
      return { data: null, error };
    }
    return { data, error: null };
  } catch (err) {
    console.error('Unexpected error in getAvailableRFIDs:', err);
    return { data: null, error: err };
  }
};

/**
 * Assign an RFID to a guest (status -> 'assigned').
 * - Must have been 'available' previously (atomic check).
 */
export const assignRFIDToGuest = async (rfid_uid, guest_id, guest_name) => {
  try {
    const { data, error } = await supabase
      .from('rfid_tags')
      .update({
        guest_id,
        guest_name,
        status: 'assigned',
      })
      .eq('rfid_uid', rfid_uid)
      .eq('status', 'available') // atomic check
      .select('id, rfid_uid, guest_id, guest_name, status')
      .single();

    if (error) {
      console.error('Error assigning RFID:', error);
      return { data: null, error };
    }
    // If data is null, means no row matched (rfid_uid or status mismatch).
    return { data, error: null };
  } catch (err) {
    console.error('Unexpected error in assignRFIDToGuest:', err);
    return { data: null, error: err };
  }
};

/**
 * Activate an RFID (status -> 'active').
 * Typically called after the guest physically scans it.
 * - Must have been 'assigned' previously.
 */
export const activateRFID = async (rfid_uid) => {
  try {
    const { data, error } = await supabase
      .from('rfid_tags')
      .update({ status: 'active' })
      .eq('rfid_uid', rfid_uid)
      .eq('status', 'assigned') // only activate if it was assigned
      .select('id, rfid_uid, guest_id, guest_name, status')
      .single();

    if (error) {
      console.error('Error activating RFID:', error);
      return { data: null, error };
    }
    return { data, error: null };
  } catch (err) {
    console.error('Unexpected error in activateRFID:', err);
    return { data: null, error: err };
  }
};

/**
 * Mark an RFID as lost (status -> 'lost').
 * You can choose whether to also clear guest_id or not.
 */
export const markRFIDLost = async (rfid_uid) => {
  try {
    const { data, error } = await supabase
      .from('rfid_tags')
      .update({ status: 'lost' })
      .eq('rfid_uid', rfid_uid)
      .neq('status', 'lost') // only update if not already lost
      .select('id, rfid_uid, guest_id, guest_name, status')
      .single();

    if (error) {
      console.error('Error marking RFID lost:', error);
      return { data: null, error };
    }
    return { data, error: null };
  } catch (err) {
    console.error('Unexpected error in markRFIDLost:', err);
    return { data: null, error: err };
  }
};

/**
 * Unassign an RFID (status -> 'available').
 * Resets guest_id and guest_name to null, for re-use.
 */
export const unassignRFID = async (rfid_uid) => {
  try {
    const { data, error } = await supabase
      .from('rfid_tags')
      .update({
        guest_id: null,
        guest_name: null,
        status: 'available',
      })
      .eq('rfid_uid', rfid_uid)
      .neq('status', 'available') // only update if it's not already available
      .select('id, rfid_uid, guest_id, guest_name, status')
      .single();

    if (error) {
      console.error('Error unassigning RFID:', error);
      return { data: null, error };
    }
    return { data, error: null };
  } catch (err) {
    console.error('Unexpected error in unassignRFID:', err);
    return { data: null, error: err };
  }
};
