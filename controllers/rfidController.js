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
import { findRoomByGuestAndNumber } from '../models/roomsModel.js';

/**
 * GET /api/rfid/all
 */
export const getAllRFIDTags = async (req, res) => {
  try {
    const { data, error } = await getAllRFIDs();
    if (error) {
      console.error('[getAllRFIDTags] Database error:', error);
      return res.status(500).json({
        success: false,
        message: 'Database error: Unable to fetch all RFID tags.',
      });
    }
    return res.status(200).json({
      success: true,
      message: 'All RFID tags fetched successfully.',
      data,
    });
  } catch (error) {
    console.error('[getAllRFIDTags] Unexpected error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

/**
 * GET /api/rfid/available
 */
export const getAvailableRFIDTags = async (req, res) => {
  try {
    const { data, error } = await getAvailableRFIDs();
    if (error) {
      console.error('[getAvailableRFIDTags] Database error:', error);
      return res.status(500).json({
        success: false,
        message: 'Database error: Unable to fetch available RFID tags.',
      });
    }
    return res.status(200).json({
      success: true,
      message: 'Available RFID tags fetched successfully.',
      data,
    });
  } catch (error) {
    console.error('[getAvailableRFIDTags] Unexpected error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

/**
 * POST /api/rfid/assign
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

    // Validate that the guest exists
    const { data: guestData, error: guestError } = await findUserById(guest_id);
    if (guestError) {
      console.error('[assignRFID] Error finding guest:', guestError);
      return res.status(500).json({
        success: false,
        message: 'Database error: Unable to fetch guest.',
      });
    }
    if (!guestData) {
      return res.status(404).json({ success: false, message: 'Guest not found.' });
    }

    // Check that the RFID exists and is available
    const { data: rfidRecord, error: rfidError } = await findRFIDByUID(rfid_uid);
    if (rfidError) {
      console.error('[assignRFID] Error finding RFID:', rfidError);
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
        message: `RFID ${rfid_uid} is not available. Current status: ${rfidRecord.status}.`,
      });
    }

    // Assign RFID
    const { data, error } = await assignRFIDToGuest(rfid_uid, guest_id);
    if (error) {
      console.error('[assignRFID] Database error assigning RFID:', error);
      return res.status(500).json({
        success: false,
        message: 'Database error: Unable to assign RFID.',
      });
    }
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
    console.error('[assignRFID] Unexpected error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

/**
 * POST /api/rfid/activate
 */
export const activateRFIDTag = async (req, res) => {
  try {
    const { rfid_uid } = req.body;
    if (!rfid_uid) {
      return res.status(400).json({ success: false, message: 'rfid_uid is required.' });
    }
    const { data, error } = await activateRFID(rfid_uid);
    if (error) {
      console.error('[activateRFIDTag] Error activating RFID:', error);
      return res.status(500).json({
        success: false,
        message: 'Database error: Unable to activate RFID.',
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
      message: `RFID ${rfid_uid} activated successfully (status: active).`,
      data,
    });
  } catch (error) {
    console.error('[activateRFIDTag] Unexpected error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

/**
 * POST /api/rfid/lost
 */
export const markRFIDAsLost = async (req, res) => {
  try {
    const { rfid_uid } = req.body;
    if (!rfid_uid) {
      return res.status(400).json({ success: false, message: 'rfid_uid is required.' });
    }
    const { data, error } = await markRFIDLost(rfid_uid);
    if (error) {
      console.error('[markRFIDAsLost] Error marking RFID lost:', error);
      return res.status(500).json({
        success: false,
        message: 'Database error: Unable to mark RFID as lost.',
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
    console.error('[markRFIDAsLost] Unexpected error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

/**
 * POST /api/rfid/unassign
 */
export const unassignRFIDTag = async (req, res) => {
  try {
    const { rfid_uid } = req.body;
    if (!rfid_uid) {
      return res.status(400).json({ success: false, message: 'rfid_uid is required.' });
    }
    const { data, error } = await unassignRFID(rfid_uid);
    if (error) {
      console.error('[unassignRFIDTag] Error unassigning RFID:', error);
      return res.status(500).json({
        success: false,
        message: 'Database error: Unable to unassign RFID.',
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
    console.error('[unassignRFIDTag] Unexpected error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

/**
 * POST /api/rfid/verify
 * Production-grade verification logic that returns success only when a valid, non-expired room is assigned.
 */
export const verifyRFID = async (req, res) => {
  try {
    const { rfid_uid, room_number } = req.body;
    if (!rfid_uid) {
      return res.status(400).json({
        success: false,
        message: 'rfid_uid is required.',
      });
    }

    // 1) Fetch the RFID record.
    let { data: rfidData, error: rfidError } = await findRFIDByUID(rfid_uid);
    if (rfidError) {
      console.error('[verifyRFID] Error finding RFID:', rfidError);
      return res.status(500).json({
        success: false,
        message: 'Database error: Unable to look up RFID.',
      });
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
    const { data: guestData, error: guestError } = await findUserById(rfidData.guest_id);
    if (guestError) {
      console.error('[verifyRFID] Error finding guest:', guestError);
      return res.status(500).json({
        success: false,
        message: 'Database error: Unable to look up guest.',
      });
    }
    if (!guestData) {
      return res.status(404).json({ success: false, message: 'Guest not found.' });
    }

    // 4) Determine the target room.
    let targetRoomNumber = room_number;
    if (!targetRoomNumber) {
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

    // 5) Ensure the guest has that specific room reserved or occupied.
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
        message: `Access denied: Guest has not reserved or is not occupying room ${targetRoomNumber}.`,
      });
    }

    // 6) Check timing based on room status.
    if (roomData.status === 'occupied') {
      if (roomData.check_out) {
        const now = new Date();
        const checkOutTime = new Date(roomData.check_out);
        console.log(`[DEBUG] Current time: ${now.toISOString()}`);
        console.log(`[DEBUG] Room check_out time: ${checkOutTime.toISOString()}`);
        if (now.getTime() >= checkOutTime.getTime()) {
          console.log(`[verifyRFID] Room ${roomData.room_number} check_out time has passed. Denying access.`);
          return res.status(403).json({
            success: false,
            message: 'Access denied: Your stay has ended.',
            data: { rfid: rfidData, guest: guestData, room: roomData },
          });
        }
      }
    } else if (roomData.status === 'reserved') {
      // Upgrade reserved room to occupied.
      const rawHours = roomData.hours_stay;
      let hoursStay = rawHours ? parseFloat(rawHours) : 0;
      if (isNaN(hoursStay) || hoursStay <= 0) {
        console.warn(`[verifyRFID] Invalid hours_stay (${rawHours}). Defaulting to 1 hour.`);
        hoursStay = 1;
      }
      const checkInTime = new Date();
      const checkOutTime = new Date(checkInTime.getTime() + hoursStay * 60 * 60 * 1000);
      console.log(`[verifyRFID] Upgrading room ${roomData.room_number} from 'reserved' to 'occupied'.`);
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

    // 8) Return final data for successful verification.
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
    console.error('[verifyRFID] Unexpected error verifying RFID:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error.',
    });
  }
};
