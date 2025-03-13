// controllers/roomsController.js

import {
  createRoom,
  getRoomById,
  getAllRooms,
  updateRoom,
  deleteRoom,
  checkInRoom,
  checkOutRoom,
  updateRoomByNumber,
  findRoomByNumber,
} from '../models/roomsModel.js';

/**
 * POST /api/rooms
 * Create a new room record.
 * When a guest reserves a room, the room's status is set to 'reserved'.
 * (Room 101 should be reserved only once.)
 */
export const addRoom = async (req, res) => {
  try {
    const { guest_id, guest_name, room_number, hours_stay } = req.body;
    if (!guest_id || !room_number || !hours_stay) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: guest_id, room_number, hours_stay.',
      });
    }

    // Check if this room_number already exists
    const { data: existingRoom, error: findError } = await findRoomByNumber(room_number);
    if (findError) {
      console.error('Error checking existing room:', findError);
      return res.status(500).json({
        success: false,
        message: 'Error checking existing room',
        error: findError,
      });
    }
    if (existingRoom) {
      return res.status(400).json({
        success: false,
        message: `Room number ${room_number} already exists.`,
      });
    }

    // Prepare new room data; guest reservation sets status to 'reserved'
    const newRoom = {
      guest_id,
      guest_name: guest_name || null,
      room_number: room_number.toString(),
      hours_stay,
      status: 'reserved',
      registration_time: new Date().toISOString(),
    };

    const { data, error } = await createRoom(newRoom);
    if (error) {
      console.error('Error inserting room data into DB:', error);
      return res.status(500).json({
        success: false,
        message: 'Error inserting room data into DB',
        error,
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Room created successfully',
      data,
    });
  } catch (error) {
    console.error('Unexpected error in addRoom:', error);
    return res.status(500).json({ success: false, message: 'Internal server error', error });
  }
};

/**
 * PUT /api/rooms/assign
 * Assign (reserve) a room by room_number.
 * The room must be available. Once reserved, room 101 cannot be reserved again.
 */
export const assignRoomByNumber = async (req, res) => {
  try {
    const { room_number, guest_id, guest_name, hours_stay } = req.body;
    if (!room_number || !guest_id || !hours_stay) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: room_number, guest_id, hours_stay.',
      });
    }

    const updateFields = {
      guest_id,
      guest_name: guest_name || null,
      hours_stay,
      status: 'reserved',
      registration_time: new Date().toISOString(),
    };

    const { data, error } = await updateRoomByNumber(room_number, updateFields, {
      onlyIfAvailable: true,
    });

    if (error) {
      console.error('Error updating room by number:', error);
      return res.status(500).json({
        success: false,
        message: 'Error updating room record in DB',
        error,
      });
    }
    if (!data) {
      return res.status(400).json({
        success: false,
        message: `No available room found with room_number = ${room_number}`,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Room updated successfully',
      data,
    });
  } catch (error) {
    console.error('Error in assignRoomByNumber:', error);
    return res.status(500).json({ success: false, message: 'Internal server error', error });
  }
};

/**
 * GET /api/rooms/:id
 * Get room details by room ID.
 */
export const getRoom = async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await getRoomById(id);
    if (error) {
      console.error('Error fetching room data:', error);
      return res.status(500).json({ success: false, message: 'Error fetching room data', error });
    }
    if (!data) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }
    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('Unexpected error in getRoom:', error);
    return res.status(500).json({ success: false, message: 'Internal server error', error });
  }
};

/**
 * GET /api/rooms
 * Get all room records.
 */
export const getRooms = async (req, res) => {
  try {
    const { data, error } = await getAllRooms();
    if (error) {
      console.error('Error fetching rooms:', error);
      return res.status(500).json({ success: false, message: 'Error fetching rooms', error });
    }
    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('Unexpected error in getRooms:', error);
    return res.status(500).json({ success: false, message: 'Internal server error', error });
  }
};

/**
 * PUT /api/rooms/:id
 * Update room details by room ID.
 */
export const modifyRoom = async (req, res) => {
  try {
    const { id } = req.params;
    const updateFields = req.body;
    if (!updateFields || Object.keys(updateFields).length === 0) {
      return res.status(400).json({ success: false, message: 'No update fields provided.' });
    }
    const { data, error } = await updateRoom(id, updateFields);
    if (error) {
      console.error('Error updating room data:', error);
      return res.status(500).json({ success: false, message: 'Error updating room data', error });
    }
    return res.status(200).json({ success: true, message: 'Room updated successfully', data });
  } catch (error) {
    console.error('Unexpected error in modifyRoom:', error);
    return res.status(500).json({ success: false, message: 'Internal server error', error });
  }
};

/**
 * DELETE /api/rooms/:id
 * Delete a room record.
 */
export const removeRoom = async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await deleteRoom(id);
    if (error) {
      console.error('Error deleting room:', error);
      return res.status(500).json({ success: false, message: 'Error deleting room', error });
    }
    return res.status(200).json({ success: true, message: 'Room deleted successfully', data });
  } catch (error) {
    console.error('Unexpected error in removeRoom:', error);
    return res.status(500).json({ success: false, message: 'Internal server error', error });
  }
};

/**
 * POST /api/rooms/:id/checkin
 * Check a guest into a room (manual usage).
 */
export const roomCheckIn = async (req, res) => {
  try {
    const { id } = req.params;
    const { check_in } = req.body;
    const checkInTime = check_in || new Date().toISOString();
    const { data, error } = await checkInRoom(id, checkInTime);
    if (error) {
      console.error('Error during check-in:', error);
      return res.status(500).json({ success: false, message: 'Error during check-in', error });
    }
    return res.status(200).json({ success: true, message: 'Check-in successful', data });
  } catch (error) {
    console.error('Unexpected error in roomCheckIn:', error);
    return res.status(500).json({ success: false, message: 'Internal server error', error });
  }
};

/**
 * POST /api/rooms/:id/checkout
 * Check a guest out from a room (manual usage).
 */
export const roomCheckOut = async (req, res) => {
  try {
    const { id } = req.params;
    const { check_out } = req.body;
    const checkOutTime = check_out || new Date().toISOString();
    const { data, error } = await checkOutRoom(id, checkOutTime);
    if (error) {
      console.error('Error during check-out:', error);
      return res.status(500).json({ success: false, message: 'Error during check-out', error });
    }
    return res.status(200).json({ success: true, message: 'Check-out successful', data });
  } catch (error) {
    console.error('Unexpected error in roomCheckOut:', error);
    return res.status(500).json({ success: false, message: 'Internal server error', error });
  }
};
