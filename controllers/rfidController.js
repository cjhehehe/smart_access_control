/************************************************
 * controllers/rfidController.js
 ************************************************/
import {
  findRFIDByUID,
  getAllRFIDs,
  getAvailableRFIDs,
  assignRFIDToGuest,
  activateRFID,
  markRFIDLost,
  unassignRFID,
} from '../models/rfidModel.js';

import { findUserById } from '../models/userModel.js';
import supabase from '../config/supabase.js';
import {
  findRoomByGuestAndNumber,
} from '../models/roomsModel.js';

/**
 * GET /api/rfid/all
 * Fetch all RFID tags (admin usage).
 */
export const getAllRFIDTags = async (req, res) => {
  try {
    const { data, error } = await getAllRFIDs();
    if (error) {
      console.error('Error fetching all RFID tags:', error);
      return res.status(500).json({
        success: false,
        message: 'Database error: Unable to fetch all RFID tags',
      });
    }
    return res.status(200).json({
      success: true,
      message: 'All RFID tags fetched successfully',
      data,
    });
  } catch (error) {
    console.error('Error in getAllRFIDTags:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * GET /api/rfid/available
 * Fetch only the RFID tags that are currently in 'available' status.
 */
export const getAvailableRFIDTags = async (req, res) => {
  try {
    const { data, error } = await getAvailableRFIDs();
    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({
        success: false,
        message: 'Database error: Unable to fetch available RFID tags',
      });
    }
    return res.status(200).json({
      success: true,
      message: 'Available RFID tags fetched successfully',
      data,
    });
  } catch (error) {
    console.error('Unexpected Error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * POST /api/rfid/assign
 * Assign an RFID card to a guest (status -> 'assigned').
 * Body:
 *  - guest_id: number
 *  - rfid_tag (rfid_uid): string
 *  - guest_name (optional): string
 */
export const assignRFID = async (req, res) => {
  try {
    const { guest_id, rfid_tag, guest_name } = req.body;
    if (!guest_id || !rfid_tag) {
      return res.status(400).json({
        success: false,
        message: 'Guest ID and RFID UID are required.',
      });
    }

    // 1) Validate that the guest exists
    const { data: guestData, error: guestError } = await findUserById(guest_id);
    if (guestError) {
      console.error('Error finding guest:', guestError);
      return res.status(500).json({ success: false, message: 'Error fetching guest' });
    }
    if (!guestData) {
      return res.status(404).json({ success: false, message: 'Guest not found' });
    }

    // 2) Assign RFID if it is 'available'
    const { data, error } = await assignRFIDToGuest(
      rfid_tag,
      guest_id,
      guest_name || guestData.name
    );
    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({
        success: false,
        message: 'Database error: Unable to assign RFID',
      });
    }
    if (!data) {
      return res.status(400).json({
        success: false,
        message: 'RFID is not in an available state or does not exist.',
      });
    }

    return res.status(201).json({
      success: true,
      message: 'RFID assigned to guest successfully (status: assigned)',
      data,
    });
  } catch (error) {
    console.error('Unexpected Error in assignRFID:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * POST /api/rfid/activate
 * Activate an RFID card (status -> 'active'), must already be 'assigned'.
 * Body:
 *  - rfid_uid: string
 */
export const activateRFIDTag = async (req, res) => {
  try {
    const { rfid_uid } = req.body;
    if (!rfid_uid) {
      return res.status(400).json({ success: false, message: 'rfid_uid is required.' });
    }

    const { data, error } = await activateRFID(rfid_uid);
    if (error) {
      console.error('Error activating RFID:', error);
      return res.status(500).json({
        success: false,
        message: 'Database error: Unable to activate RFID',
      });
    }
    if (!data) {
      return res.status(400).json({
        success: false,
        message: 'RFID not found or not in assigned status.',
      });
    }
    return res.status(200).json({
      success: true,
      message: 'RFID activated successfully (status: active)',
      data,
    });
  } catch (error) {
    console.error('Error in activateRFIDTag:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * POST /api/rfid/lost
 * Mark an RFID as lost (status -> 'lost').
 * Body:
 *  - rfid_uid: string
 */
export const markRFIDAsLost = async (req, res) => {
  try {
    const { rfid_uid } = req.body;
    if (!rfid_uid) {
      return res.status(400).json({ success: false, message: 'rfid_uid is required.' });
    }

    const { data, error } = await markRFIDLost(rfid_uid);
    if (error) {
      console.error('Error marking RFID lost:', error);
      return res.status(500).json({
        success: false,
        message: 'Database error: Unable to mark RFID as lost',
      });
    }
    if (!data) {
      return res.status(400).json({
        success: false,
        message: 'RFID not found or already lost.',
      });
    }
    return res.status(200).json({
      success: true,
      message: 'RFID status changed to lost',
      data,
    });
  } catch (error) {
    console.error('Error in markRFIDAsLost:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * POST /api/rfid/unassign
 * Unassign an RFID (status -> 'available').
 * Body:
 *  - rfid_uid: string
 */
export const unassignRFIDTag = async (req, res) => {
  try {
    const { rfid_uid } = req.body;
    if (!rfid_uid) {
      return res.status(400).json({ success: false, message: 'rfid_uid is required.' });
    }

    const { data, error } = await unassignRFID(rfid_uid);
    if (error) {
      console.error('Error unassigning RFID:', error);
      return res.status(500).json({
        success: false,
        message: 'Database error: Unable to unassign RFID',
      });
    }
    if (!data) {
      return res.status(400).json({
        success: false,
        message: 'RFID not found or already available.',
      });
    }
    return res.status(200).json({
      success: true,
      message: 'RFID unassigned successfully (status: available)',
      data,
    });
  } catch (error) {
    console.error('Error in unassignRFIDTag:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * POST /api/rfid/verify
 * Verify an RFID for door access:
 *  1) RFID must have status 'assigned' or 'active'.
 *  2) RFID must be linked to a valid guest.
 *  3) The guest must have reserved (or be occupying) the room in question.
 *  4) If room is 'reserved', automatically set it to 'occupied' and set
 *     check_in/check_out times based on hours_stay.
 *  5) Return the final room + RFID + guest data.
 *
 * Request Body:
 *  - rfid_uid: string
 *  - room_number (optional): string or number
 *
 * If room_number is missing, attempts to auto-detect exactly one 'reserved' or 'occupied' room for the guest.
 *
 * IMPORTANT NOTE:
 *  - Make sure that when you set the check_out time, it is truly in the future
 *    (e.g., check_in + hours_stay). If check_out is behind or equal to the current time,
 *    your CRON job or subsequent logic may immediately auto-check-out the room.
 *  - Ensure your server and DB are storing times in UTC for consistency.
 */
export const verifyRFID = async (req, res) => {
  try {
    const { rfid_uid, room_number } = req.body;

    // 1) Validate request
    if (!rfid_uid) {
      return res.status(400).json({ success: false, message: 'RFID UID is required.' });
    }

    // 2) Fetch the RFID record
    let { data: rfidData, error } = await findRFIDByUID(rfid_uid);
    if (error) {
      console.error('[verifyRFID] Error finding RFID:', error);
      return res.status(500).json({ success: false, message: 'Error finding RFID.' });
    }
    if (!rfidData) {
      return res.status(404).json({ success: false, message: 'RFID not found.' });
    }

    // 3) Check RFID status
    if (!['assigned', 'active'].includes(rfidData.status)) {
      return res.status(403).json({
        success: false,
        message: `RFID is found but not valid for entry (status: ${rfidData.status}).`,
      });
    }

    // 4) Check that RFID is linked to a guest
    if (!rfidData.guest_id) {
      return res.status(403).json({
        success: false,
        message: 'RFID is not assigned to any guest.',
      });
    }
    const { data: guestData } = await findUserById(rfidData.guest_id);
    if (!guestData) {
      return res.status(404).json({ success: false, message: 'Guest not found.' });
    }

    // 5) Determine the target room to open
    let targetRoomNumber = room_number;
    if (!targetRoomNumber) {
      // Attempt auto-detect if room_number is missing
      const { data: possibleRooms, error: fetchError } = await supabase
        .from('rooms')
        .select('*')
        .eq('guest_id', rfidData.guest_id)
        .in('status', ['reserved', 'occupied']);

      if (fetchError) {
        console.error('[verifyRFID] Error fetching rooms for auto-detect:', fetchError);
        return res.status(500).json({
          success: false,
          message: 'Error fetching room information.',
        });
      }

      if (!possibleRooms || possibleRooms.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'No reserved/occupied room found for this guest.',
        });
      }
      if (possibleRooms.length > 1) {
        return res.status(400).json({
          success: false,
          message: 'Multiple rooms found for this guest. Please specify a room_number.',
        });
      }
      // Exactly one found
      targetRoomNumber = possibleRooms[0].room_number;
    }

    // 6) Check that the guest indeed has that specific room reserved/occupied
    let { data: roomData, error: roomError } = await findRoomByGuestAndNumber(
      rfidData.guest_id,
      targetRoomNumber
    );
    if (roomError) {
      console.error('[verifyRFID] Error checking room reservation:', roomError);
      return res.status(500).json({
        success: false,
        message: 'Error checking room reservation.',
      });
    }
    if (!roomData) {
      return res.status(403).json({
        success: false,
        message: `Access denied: Guest has not reserved room ${targetRoomNumber}.`,
      });
    }

    // 7) If RFID is 'assigned', upgrade to 'active'
    if (rfidData.status === 'assigned') {
      const { data: updatedRFID, error: activationError } = await activateRFID(rfid_uid);
      if (activationError) {
        console.error('[verifyRFID] Error activating RFID:', activationError);
        return res.status(500).json({
          success: false,
          message: 'Error activating RFID.',
        });
      }
      rfidData = updatedRFID;
    }

    // 8) If room is 'reserved', set it to 'occupied' and compute check_in/check_out
    if (roomData.status === 'reserved') {
      const rawHours = roomData.hours_stay;
      let hoursStay = rawHours ? parseFloat(rawHours) : 0;

      // Default to 1 hour if invalid
      if (isNaN(hoursStay) || hoursStay <= 0) {
        console.warn(`[verifyRFID] Invalid hours_stay (${rawHours}). Defaulting to 1 hour.`);
        hoursStay = 1;
      }

      const checkInTime = new Date();
      const checkOutTime = new Date(checkInTime.getTime() + hoursStay * 60 * 60 * 1000);

      // If you want to ensure these are definitely stored in UTC, we use .toISOString()
      const { data: occupiedRoom, error: checkInError } = await supabase
        .from('rooms')
        .update({
          status: 'occupied',
          check_in: checkInTime.toISOString(),
          check_out: checkOutTime.toISOString(),
        })
        .eq('id', roomData.id)
        .single();

      if (checkInError) {
        console.error('[verifyRFID] Error updating room to occupied:', checkInError);
        return res.status(500).json({
          success: false,
          message: 'Error updating room to occupied.',
        });
      }
      roomData = occupiedRoom;

      // Important: checkOutTime is now in the future if hours_stay > 0.
      // If your CRON sees a check_out that is in the past or now,
      // it will auto-check-out immediately. Confirm hours_stay is set properly.
    } else {
      console.log(`[verifyRFID] Room ${roomData.room_number} is already '${roomData.status}'`);
    }

    // 9) Success response
    return res.status(200).json({
      success: true,
      message: 'RFID verified successfully.',
      data: {
        rfid: rfidData,
        guest: guestData,
        room: roomData,
      },
    });
  } catch (error) {
    console.error('Error verifying RFID:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
