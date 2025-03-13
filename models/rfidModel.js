// models/rfidModel.js

import supabase from '../config/supabase.js';

/**
 * Find an RFID by its UID.
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
 * Fetch ALL RFID tags.
 */
export const getAllRFIDs = async () => {
  try {
    const { data, error } = await supabase
      .from('rfid_tags')
      .select('*');
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
 * Fetch only RFID tags that are 'available'.
 */
export const getAvailableRFIDs = async () => {
  try {
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
 * Must be 'available' before assignment.
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
      .eq('status', 'available')
      .select('id, rfid_uid, guest_id, guest_name, status')
      .single();

    if (error) {
      console.error('Error assigning RFID:', error);
      return { data: null, error };
    }
    return { data, error: null };
  } catch (err) {
    console.error('Unexpected error in assignRFIDToGuest:', err);
    return { data: null, error: err };
  }
};

/**
 * Activate an RFID (status -> 'active').
 * Must be 'assigned' before activation.
 */
export const activateRFID = async (rfid_uid) => {
  try {
    const { data, error } = await supabase
      .from('rfid_tags')
      .update({ status: 'active' })
      .eq('rfid_uid', rfid_uid)
      .eq('status', 'assigned')
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
 */
export const markRFIDLost = async (rfid_uid) => {
  try {
    const { data, error } = await supabase
      .from('rfid_tags')
      .update({ status: 'lost' })
      .eq('rfid_uid', rfid_uid)
      .neq('status', 'lost')
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
 * Clears guest_id and guest_name.
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
      .neq('status', 'available')
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
  