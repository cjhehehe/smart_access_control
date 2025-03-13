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
 * Create a new room record (initial status = 'reserved').
 * Use this endpoint when creating a reservation.
 *
 * Expects in req.body:
 *  - guest_id (number)
 *  - room_number (string or number)
 *  - hours_stay (number)
 *
 * We no longer store guest_name in the 'rooms' table.
 * registration_time is stored as a UTC timestamp (new Date().toISOString()).
 */
export const addRoom = async (req, res) => {
  try {
    const { guest_id, room_number, hours_stay } = req.body;

    // Basic checks
    if (!guest_id || !room_number || hours_stay == null) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: guest_id, room_number, hours_stay.',
      });
    }

    // Parse hours_stay as float
    const numericHoursStay = parseFloat(hours_stay);
    if (isNaN(numericHoursStay) || numericHoursStay <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid hours_stay. Must be a positive decimal.',
      });
    }

    // Check if this room_number already exists
    const { data: existingRoom, error: findError } = await findRoomByNumber(room_number);
    if (findError) {
      console.error('Error checking existing room:', findError);
      return res.status(500).json({
        success: false,
        message: 'Database error: Error checking existing room',
        error: findError,
      });
    }
    if (existingRoom) {
      return res.status(400).json({
        success: false,
        message: `Room number ${room_number} already exists.`,
      });
    }

    // Prepare new room data
    const newRoom = {
      guest_id,
      room_number: room_number.toString(),
      hours_stay: numericHoursStay, // numeric in DB
      status: 'reserved',
      registration_time: new Date().toISOString(), // store in UTC
    };

    const { data, error } = await createRoom(newRoom);
    if (error) {
      console.error('Error inserting room data into DB:', error);
      return res.status(500).json({
        success: false,
        message: 'Database error: Error inserting room data',
        error,
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Room created successfully (status=reserved)',
      data,
    });
  } catch (error) {
    console.error('Unexpected error in addRoom:', error);
    return res.status(500).json({ success: false, message: 'Internal server error', error });
  }
};

/**
 * PUT /api/rooms/assign
 * Assign (reserve) a room by room_number (status -> 'reserved').
 * Only updates if the room is currently 'available'.
 *
 * Expects in req.body:
 *  - room_number (string or number)
 *  - guest_id (number)
 *  - hours_stay (number)
 *
 * Sets registration_time to current UTC time.
 */
export const assignRoomByNumber = async (req, res) => {
  try {
    const { room_number, guest_id, hours_stay } = req.body;
    if (!room_number || !guest_id || hours_stay == null) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: room_number, guest_id, hours_stay.',
      });
    }

    // Parse hours_stay as float
    const numericHoursStay = parseFloat(hours_stay);
    if (isNaN(numericHoursStay) || numericHoursStay <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid hours_stay. Must be a positive decimal.',
      });
    }

    const updateFields = {
      guest_id,
      hours_stay: numericHoursStay,
      status: 'reserved',
      registration_time: new Date().toISOString(), // store in UTC
    };

    // Only update if the room is 'available'
    const { data, error } = await updateRoomByNumber(room_number, updateFields, {
      onlyIfAvailable: true,
    });

    if (error) {
      console.error('Error updating room by number:', error);
      return res.status(500).json({
        success: false,
        message: 'Database error: Error updating room record',
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
      message: 'Room reserved (status=reserved) successfully',
      data,
    });
  } catch (error) {
    console.error('Error in assignRoomByNumber:', error);
    return res.status(500).json({ success: false, message: 'Internal server error', error });
  }
};

/**
 * GET /api/rooms/:id
 * Retrieve a single room by ID.
 */
export const getRoom = async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await getRoomById(id);
    if (error) {
      console.error('Error fetching room data:', error);
      return res.status(500).json({ success: false, message: 'Database error: Error fetching room data', error });
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
 * Retrieve all room records.
 */
export const getRooms = async (req, res) => {
  try {
    const { data, error } = await getAllRooms();
    if (error) {
      console.error('Error fetching rooms:', error);
      return res.status(500).json({ success: false, message: 'Database error: Error fetching rooms', error });
    }
    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('Unexpected error in getRooms:', error);
    return res.status(500).json({ success: false, message: 'Internal server error', error });
  }
};

/**
 * PUT /api/rooms/:id
 * Update specific fields of a room by its ID.
 *
 * Example body:
 *  {
 *    "hours_stay": 5,
 *    "status": "maintenance" // etc.
 *  }
 *
 * If hours_stay is provided, it must be a positive decimal.
 */
export const modifyRoom = async (req, res) => {
  try {
    const { id } = req.params;
    const updateFields = req.body;
    if (!updateFields || Object.keys(updateFields).length === 0) {
      return res.status(400).json({ success: false, message: 'No update fields provided.' });
    }

    // If hours_stay is present, parse it
    if (updateFields.hours_stay != null) {
      const numericHoursStay = parseFloat(updateFields.hours_stay);
      if (isNaN(numericHoursStay) || numericHoursStay <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Invalid hours_stay. Must be a positive decimal.',
        });
      }
      updateFields.hours_stay = numericHoursStay;
    }

    const { data, error } = await updateRoom(id, updateFields);
    if (error) {
      console.error('Error updating room data:', error);
      return res.status(500).json({ success: false, message: 'Database error: Error updating room data', error });
    }

    return res.status(200).json({
      success: true,
      message: 'Room updated successfully',
      data,
    });
  } catch (error) {
    console.error('Unexpected error in modifyRoom:', error);
    return res.status(500).json({ success: false, message: 'Internal server error', error });
  }
};

/**
 * DELETE /api/rooms/:id
 * Delete a room record by ID.
 */
export const removeRoom = async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await deleteRoom(id);
    if (error) {
      console.error('Error deleting room:', error);
      return res.status(500).json({ success: false, message: 'Database error: Error deleting room', error });
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
 * Sets check_in time (UTC) and updates status to 'occupied'.
 *
 * Body can include:
 *  - check_in: override time in ISO string if needed
 */
export const roomCheckIn = async (req, res) => {
  try {
    const { id } = req.params;
    const { check_in } = req.body;
    const checkInTime = check_in || new Date().toISOString();

    const { data, error } = await checkInRoom(id, checkInTime);
    if (error) {
      console.error('Error during check-in:', error);
      return res.status(500).json({ success: false, message: 'Database error: Error during check-in', error });
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
 * Sets check_out time (UTC) and updates status to 'available'.
 *
 * Body can include:
 *  - check_out: override time in ISO string if needed
 */
export const roomCheckOut = async (req, res) => {
  try {
    const { id } = req.params;
    const { check_out } = req.body;
    const checkOutTime = check_out || new Date().toISOString();

    const { data, error } = await checkOutRoom(id, checkOutTime);
    if (error) {
      console.error('Error during check-out:', error);
      return res.status(500).json({ success: false, message: 'Database error: Error during check-out', error });
    }
    return res.status(200).json({ success: true, message: 'Check-out successful', data });
  } catch (error) {
    console.error('Unexpected error in roomCheckOut:', error);
    return res.status(500).json({ success: false, message: 'Internal server error', error });
  }
};
