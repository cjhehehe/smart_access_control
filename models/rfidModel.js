// models/rfidModel.js

import supabase from '../config/supabase.js';

/**
 * Find an RFID by its UID (rfid_uid).
 * We only select columns that exist in rfid_tags: id, rfid_uid, guest_id, status.
 */
export const findRFIDByUID = async (rfid_uid) => {
  try {
    const { data, error } = await supabase
      .from('rfid_tags')
      .select('id, rfid_uid, guest_id, status')
      .eq('rfid_uid', rfid_uid)
      .maybeSingle();

    if (error) {
      console.error('[findRFIDByUID] Error finding RFID:', error);
      return { data: null, error };
    }
    return { data, error: null };
  } catch (err) {
    console.error('[findRFIDByUID] Unexpected error:', err);
    return { data: null, error: err };
  }
};

/**
 * Fetch ALL RFID tags.
 */

export const getAllRFIDs = async () => {
  try {
    // Select * if you want all columns, or specify columns if you only need a subset.
    const { data, error } = await supabase
      .from('rfid_tags')
      .select('*');
    if (error) {
      console.error('[getAllRFIDs] Error fetching RFID tags:', error);
      return { data: null, error };
    }
    return { data, error: null };
  } catch (err) {
    console.error('[getAllRFIDs] Unexpected error:', err);
    return { data: null, error: err };
  }
};

/**
 * Fetch only RFID tags that are 'available'.
 */
export const getAvailableRFIDs = async () => {
  try {
    // Only select columns that actually exist in rfid_tags
    const { data, error } = await supabase
      .from('rfid_tags')
      .select('id, rfid_uid, status')
      .eq('status', 'available');

    if (error) {
      console.error('[getAvailableRFIDs] Error fetching available RFID tags:', error);
      return { data: null, error };
    }
    return { data, error: null };
  } catch (err) {
    console.error('[getAvailableRFIDs] Unexpected error:', err);
    return { data: null, error: err };
  }
};

/**
 * Assign an RFID to a guest (status -> 'assigned').
 * Must be 'available' before assignment.
 */
export const assignRFIDToGuest = async (rfid_uid, guest_id) => {
  try {
    // Update only columns that exist. No 'guest_name' if it's not in your DB.
    const { data, error } = await supabase
      .from('rfid_tags')
      .update({
        guest_id,
        status: 'assigned',
      })
      .eq('rfid_uid', rfid_uid)
      .eq('status', 'available') // Must match "available" to be updated
      .select('id, rfid_uid, guest_id, status')
      .single();

    if (error) {
      console.error('[assignRFIDToGuest] Error assigning RFID:', error);
      return { data: null, error };
    }
    // If data is null, that means no row was updated (mismatch on eq conditions).
    if (!data) {
      console.warn(`[assignRFIDToGuest] No row updated for RFID ${rfid_uid}. Possibly not 'available'.`);
    }
    return { data, error: null };
  } catch (err) {
    console.error('[assignRFIDToGuest] Unexpected error:', err);
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
      .select('id, rfid_uid, guest_id, status')
      .single();

    if (error) {
      console.error('[activateRFID] Error activating RFID:', error);
      return { data: null, error };
    }
    return { data, error: null };
  } catch (err) {
    console.error('[activateRFID] Unexpected error:', err);
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
      .neq('status', 'lost') // Only update if current status is not already 'lost'
      .select('id, rfid_uid, guest_id, status')
      .single();

    if (error) {
      console.error('[markRFIDLost] Error marking RFID lost:', error);
      return { data: null, error };
    }
    return { data, error: null };
  } catch (err) {
    console.error('[markRFIDLost] Unexpected error:', err);
    return { data: null, error: err };
  }
};

/**
 * Unassign an RFID (status -> 'available').
 * Clears guest_id, sets status to 'available'.
 */
export const unassignRFID = async (rfid_uid) => {
  try {
    const { data, error } = await supabase
      .from('rfid_tags')
      .update({
        guest_id: null,
        status: 'available',
      })
      .eq('rfid_uid', rfid_uid)
      .neq('status', 'available') // Only unassign if not already 'available'
      .select('id, rfid_uid, guest_id, status')
      .single();

    if (error) {
      console.error('[unassignRFID] Error unassigning RFID:', error);
      return { data: null, error };
    }
    return { data, error: null };
  } catch (err) {
    console.error('[unassignRFID] Unexpected error:', err);
    return { data: null, error: err };
  }
};

/**
 * Reset all RFID tags for a specific guest to 'available'
 * if they are 'active' or 'assigned'.
 */
export const resetRFIDByGuest = async (guest_id) => {
  try {
    const { data, error } = await supabase
      .from('rfid_tags')
      .update({
        guest_id: null,
        status: 'available',
      })
      .eq('guest_id', guest_id)
      .in('status', ['active', 'assigned'])
      .select('id, rfid_uid, guest_id, status');

    if (error) {
      console.error('[resetRFIDByGuest] Error resetting RFID:', error);
      return { data: null, error };
    }
    return { data, error: null };
  } catch (err) {
    console.error('[resetRFIDByGuest] Unexpected error:', err);
    return { data: null, error: err };
  }
};
