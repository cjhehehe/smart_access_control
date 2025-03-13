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
import { findUserById } from '../models/userModel.js';  // Ensure userModel is correct
import supabase from '../config/supabase.js';
import { findRoomByGuestAndNumber } from '../models/roomsModel.js';

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
    console.error('Unexpected Error in getAvailableRFIDTags:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * POST /api/rfid/assign
 * Assign an RFID card to a guest (status -> 'assigned').
 * Expects in req.body:
 *  - guest_id: number
 *  - rfid_uid: string
 */
export const assignRFID = async (req, res) => {
  try {
    const { guest_id, rfid_uid } = req.body;
    if (!guest_id || !rfid_uid) {
      return res.status(400).json({
        success: false,
        message: 'Guest ID and rfid_uid are required.',
      });
    }

    // 1) Validate that the guest exists
    const { data: guestData, error: guestError } = await findUserById(guest_id);
    if (guestError) {
      console.error('Error finding guest:', guestError);
      return res.status(500).json({
        success: false,
        message: 'Database error: Unable to fetch guest.',
      });
    }
    if (!guestData) {
      return res.status(404).json({ success: false, message: 'Guest not found.' });
    }

    // 2) Check that the RFID exists and is 'available'
    const { data: rfidRecord, error: rfidError } = await findRFIDByUID(rfid_uid);
    if (rfidError) {
      console.error('Error finding RFID:', rfidError);
      return res.status(500).json({
        success: false,
        message: 'Database error: Unable to check RFID.',
      });
    }
    if (!rfidRecord) {
      return res.status(404).json({
        success: false,
        message: `RFID ${rfid_uid} does not exist in the database.`,
      });
    }
    if (rfidRecord.status !== 'available') {
      return res.status(400).json({
        success: false,
        message: `RFID ${rfid_uid} is not available. Current status: ${rfidRecord.status}`,
      });
    }

    // 3) Assign RFID if it is 'available'
    const { data, error } = await assignRFIDToGuest(rfid_uid, guest_id);
    if (error) {
      console.error('Database error assigning RFID:', error);
      return res.status(500).json({
        success: false,
        message: 'Database error: Unable to assign RFID.',
      });
    }

    // If supabase returned null, it means the row update failed
    if (!data) {
      return res.status(400).json({
        success: false,
        message: 'Failed to assign. Possibly the RFID is no longer available.',
      });
    }

    return res.status(201).json({
      success: true,
      message: `RFID ${rfid_uid} assigned to guest ${guest_id} successfully (status: assigned).`,
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
 * Expects in req.body:
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
      message: `RFID ${rfid_uid} activated successfully (status: active)`,
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
 * Expects in req.body:
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
      message: `RFID ${rfid_uid} status changed to lost.`,
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
 * Expects in req.body:
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
      message: `RFID ${rfid_uid} unassigned successfully (status: available).`,
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
 *  5) If the room’s check_out time has passed, auto-check it out.
 *  6) Return the final room, RFID, and guest data.
 *
 * Request Body:
 *  - rfid_uid: string
 *  - room_number (optional): string or number
 */
export const verifyRFID = async (req, res) => {
  try {
    const { rfid_uid, room_number } = req.body;
    if (!rfid_uid) {
      return res.status(400).json({ success: false, message: 'rfid_uid is required.' });
    }

    // 1) Fetch the RFID record.
    let { data: rfidData, error } = await findRFIDByUID(rfid_uid);
    if (error) {
      console.error('[verifyRFID] Error finding RFID:', error);
      return res.status(500).json({ success: false, message: 'Error finding RFID.' });
    }
    if (!rfidData) {
      return res.status(404).json({ success: false, message: 'RFID not found.' });
    }

    // 2) Validate RFID status.
    if (!['assigned', 'active'].includes(rfidData.status)) {
      return res.status(403).json({
        success: false,
        message: `RFID is found but not valid for entry (status: ${rfidData.status}).`,
      });
    }

    // 3) Ensure the RFID is linked to a guest.
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

    // 4) Determine the target room.
    let targetRoomNumber = room_number;
    if (!targetRoomNumber) {
      // Auto-detect exactly one 'reserved' or 'occupied' room for that guest.
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
      targetRoomNumber = possibleRooms[0].room_number;
    }

    // 5) Ensure the guest has that room reserved or occupied.
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

    // 6) Check if the room's check-out time has passed.
    if (roomData.check_out) {
      const now = new Date();
      const checkOutTime = new Date(roomData.check_out);
      if (now >= checkOutTime) {
        // Auto-checkout: update room record to set it available and clear guest data.
        const { data: updatedRoom, error: checkOutError } = await supabase
          .from('rooms')
          .update({
            status: 'available',
            check_in: null,
            check_out: null,
            hours_stay: null,
            guest_id: null,
          })
          .eq('id', roomData.id)
          .single();
        if (checkOutError) {
          console.error('[verifyRFID] Error auto-checking out room:', checkOutError);
          return res.status(500).json({
            success: false,
            message: 'Error during auto-checkout process.',
          });
        }
        return res.status(403).json({
          success: false,
          message: 'Access denied: Your stay has ended and the room has been auto-checked out.',
          data: {
            rfid: rfidData,
            guest: guestData,
            room: updatedRoom,
          },
        });
      }
    }

    // 7) If RFID is still 'assigned', upgrade it to 'active'.
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

    // 8) If the room is 'reserved', upgrade it to 'occupied' and compute check_in/check_out.
    if (roomData.status === 'reserved') {
      const rawHours = roomData.hours_stay;
      let hoursStay = rawHours ? parseFloat(rawHours) : 0;
      if (isNaN(hoursStay) || hoursStay <= 0) {
        console.warn(`[verifyRFID] Invalid hours_stay (${rawHours}). Defaulting to 1 hour.`);
        hoursStay = 1;
      }
      const checkInTime = new Date();
      const checkOutTime = new Date(checkInTime.getTime() + hoursStay * 60 * 60 * 1000);
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
    } else {
      console.log(`[verifyRFID] Room ${roomData.room_number} is already '${roomData.status}'.`);
    }

    // 9) Return the final data.
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
