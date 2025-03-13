// controllers/rfidController.js

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
import {
  findRoomByGuestAndNumber,
  checkInRoom,
} from '../models/roomsModel.js';

/**
 * GET all RFID tags (admin usage).
 */
export const getAllRFIDTags = async (req, res) => {
  try {
    const { data, error } = await getAllRFIDs();
    if (error) {
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
 * GET available RFID tags (status = 'available').
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
    const { data: guestData, error: guestError } = await findUserById(guest_id);
    if (guestError) {
      console.error('Error finding guest:', guestError);
      return res.status(500).json({ success: false, message: 'Error fetching guest' });
    }
    if (!guestData) {
      return res.status(404).json({ success: false, message: 'Guest not found' });
    }
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
 * Activate an RFID card (status -> 'active'), must be 'assigned' first.
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
 * Mark RFID as lost (status -> 'lost').
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
 * Unassign RFID (status -> 'available').
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
 * - Must have status 'assigned' or 'active'
 * - Must reference a valid guest
 * - The guest must have reserved room 101 (only that guest is allowed access)
 *
 * The verification logic is entirely based on the guest's reservation.
 */
export const verifyRFID = async (req, res) => {
  try {
    const { rfid_uid } = req.body;
    if (!rfid_uid) {
      return res.status(400).json({ success: false, message: 'RFID UID is required.' });
    }

    // 1) Look up the RFID record
    let { data: rfidData, error } = await findRFIDByUID(rfid_uid);
    if (error) {
      return res.status(500).json({ success: false, message: 'Error finding RFID.' });
    }
    if (!rfidData) {
      return res.status(404).json({ success: false, message: 'RFID not found.' });
    }

    // 2) Validate status – must be 'assigned' or 'active'
    if (!['assigned', 'active'].includes(rfidData.status)) {
      return res.status(403).json({
        success: false,
        message: `RFID is found but not valid for entry (status: ${rfidData.status}).`,
      });
    }

    // 3) Verify that the RFID is linked to a guest
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

    // 4) Ensure the guest has reserved room number 101
    let { data: roomData, error: roomError } = await findRoomByGuestAndNumber(rfidData.guest_id, '101');
    if (roomError) {
      return res.status(500).json({
        success: false,
        message: 'Error checking room reservation.',
      });
    }
    if (!roomData) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Guest has not reserved room 101.',
      });
    }

    // 5) If the RFID is 'assigned', upgrade it to 'active'
    if (rfidData.status === 'assigned') {
      const { data: updatedRFID, error: activationError } = await activateRFID(rfid_uid);
      if (activationError) {
        console.error('Error activating RFID:', activationError);
        return res.status(500).json({
          success: false,
          message: 'Error activating RFID.',
        });
      }
      rfidData = updatedRFID;
    }

    // 6) (Optional) You could perform a room check-in update here.
    // In our case the guest’s reservation is the key: if they reserved room 101,
    // they are granted access. (Manual check-in via admin may still be available.)
    // Uncomment the following if you want to automatically update the room:
    /*
    if (roomData.status === 'reserved') {
      const { data: occupiedRoom, error: checkInError } = await checkInRoom(roomData.id);
      if (checkInError) {
        console.error('Error updating room to occupied:', checkInError);
        return res.status(500).json({
          success: false,
          message: 'Error updating room to occupied.',
        });
      }
      roomData = occupiedRoom;
    }
    */

    // 7) Return the verified data
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
