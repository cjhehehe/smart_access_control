// controllers/guestController.js

import bcrypt from 'bcryptjs';
import {
  createUser,
  findUserByEmail,
  findUserByPhone,
  findUserById,
  updateUser,
  signOutUser,
  searchUsersByQuery,
  getAllUsers,
} from '../models/userModel.js';

/**
 * Convert "bigint" or "{ low: number, high: number }" ID to a plain number
 */
function fixId(obj) {
  if (!obj) return;
  if (typeof obj.id === 'object' && obj.id !== null) {
    // e.g. { low: 2, high: 0 }
    if (typeof obj.id.low === 'number') {
      obj.id = obj.id.low;
    }
  } else if (typeof obj.id === 'bigint') {
    // If your DB driver returns BigInt
    obj.id = Number(obj.id);
  }
}

/**
 * Register a new guest with optional membership level
 */
export const registerGuest = async (req, res) => {
  try {
    const { name, email, phone, password, membershipLevel } = req.body;

    if (!name || !email || !phone || !password) {
      return res
        .status(400)
        .json({ message: 'Name, email, phone, and password are required.' });
    }

    // (Optional) Enforce uniqueness checks if needed
    // e.g. see if there's an existing user with the same email/phone

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Default membership level if none provided
    const newUser = {
      name,
      email,
      phone,
      password: hashedPassword,
      membership_level: membershipLevel || 'Regular',
      membership_start: new Date().toISOString(),
      membership_renewals: 0,
      avatar_url: null,
    };

    console.log('Registering new guest:', newUser);
    const { data, error } = await createUser(newUser);

    if (error) {
      console.error('Database Insert Error:', error);
      return res
        .status(500)
        .json({ message: 'Database error: Unable to register guest.' });
    }

    // Fix ID if it's a bigint or {low, high}
    fixId(data);

    return res
      .status(201)
      .json({ message: 'Guest registered successfully.', data });
  } catch (error) {
    console.error('Unexpected Error (registerGuest):', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

/**
 * Guest Login with password validation (accepts either email or phone).
 * Allows multiple rows for the same phone; picks the first matching password.
 */
export const loginGuest = async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({
        message: 'Identifier (email or phone) and password are required.',
      });
    }

    let guest = null;

    // If identifier looks like an email (contains '@'), fetch by email
    if (identifier.includes('@')) {
      const { data, error } = await findUserByEmail(identifier);
      if (error) {
        console.error('Error finding user by email:', error);
        return res.status(500).json({ message: 'Database error.' });
      }
      if (!data) {
        return res.status(404).json({ message: 'Guest not found.' });
      }

      // Compare password for the single user found
      const isPasswordValid = await bcrypt.compare(password, data.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: 'Invalid credentials.' });
      }

      guest = data;
    } else {
      // Otherwise, fetch by phone. This may return multiple rows
      const { data, error } = await findUserByPhone(identifier);
      if (error) {
        console.error('Error finding user by phone:', error);
        return res.status(500).json({ message: 'Database error.' });
      }
      if (!data || data.length === 0) {
        return res.status(404).json({ message: 'Guest not found.' });
      }

      // We have multiple potential guests with the same phone
      // Check each row's password until we find a match
      let matchedGuest = null;
      for (const candidate of data) {
        const isPasswordValid = await bcrypt.compare(password, candidate.password);
        if (isPasswordValid) {
          matchedGuest = candidate;
          break; // stop on first match
        }
      }

      if (!matchedGuest) {
        // None of the rows had a matching password
        return res.status(401).json({ message: 'Invalid credentials.' });
      }

      guest = matchedGuest;
    }

    // Fix ID if needed
    fixId(guest);

    // If we have a valid guest at this point, they're logged in
    return res.status(200).json({
      message: 'Guest logged in successfully.',
      guest,
    });
  } catch (error) {
    console.error('Unexpected login error:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

/**
 * Fetch a single Guest Profile by ID
 */
export const fetchGuestProfileById = async (req, res) => {
  try {
    const { guestId } = req.params;

    if (!guestId) {
      return res.status(400).json({ message: 'Guest ID is required.' });
    }

    const { data: guest, error } = await findUserById(guestId);
    if (error) {
      return res.status(500).json({ message: 'Error fetching guest.' });
    }
    if (!guest) {
      return res.status(404).json({ message: 'Guest not found.' });
    }

    // Fix ID
    fixId(guest);

    return res.status(200).json(guest);
  } catch (error) {
    console.error('Error fetching guest profile:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

/**
 * Change Guest Password
 */
export const changeGuestPassword = async (req, res) => {
  try {
    const { guestId, currentPassword, newPassword } = req.body;

    if (!guestId || !currentPassword || !newPassword) {
      return res.status(400).json({
        message: 'guestId, currentPassword, and newPassword are required.',
      });
    }

    const { data: guest, error: findError } = await findUserById(guestId);
    if (findError || !guest) {
      return res.status(404).json({ message: 'Guest not found.' });
    }

    // Compare old password
    const isPasswordValid = await bcrypt.compare(currentPassword, guest.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid current password.' });
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Update the user record
    const updateFields = { password: hashedNewPassword };
    const { data: updated, error: updateError } = await updateUser(guestId, updateFields);

    if (updateError || !updated) {
      return res
        .status(500)
        .json({ message: 'Database error: Unable to update password.' });
    }

    // fixId(updated) if you return it, but here we just return a message
    return res.status(200).json({ message: 'Guest password changed successfully.' });
  } catch (error) {
    console.error('Error changing guest password:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

/**
 * Update Guest Profile
 */
export const updateGuestProfile = async (req, res) => {
  try {
    const { guestId, name, email, phone, membershipLevel, avatarUrl } = req.body;

    if (!guestId) {
      return res.status(400).json({ message: 'guestId is required.' });
    }

    // Build an object of fields to update
    const updateFields = {};
    if (name) updateFields.name = name;
    if (email) updateFields.email = email;
    if (phone) updateFields.phone = phone;
    if (membershipLevel) updateFields.membership_level = membershipLevel;
    if (avatarUrl) updateFields.avatar_url = avatarUrl;

    if (Object.keys(updateFields).length === 0) {
      return res
        .status(400)
        .json({ message: 'No valid fields provided for update.' });
    }

    const { data: updated, error: updateError } = await updateUser(guestId, updateFields);

    if (updateError || !updated) {
      return res
        .status(500)
        .json({ message: 'Database error: Unable to update guest profile.' });
    }

    // Fix ID
    fixId(updated);

    return res
      .status(200)
      .json({ message: 'Guest profile updated successfully.', updated });
  } catch (error) {
    console.error('Error updating guest profile:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

/**
 * Dedicated endpoint: Upload Guest Avatar
 */
export const uploadGuestAvatar = async (req, res) => {
  try {
    const { guestId, newAvatarUrl } = req.body;
    if (!guestId || !newAvatarUrl) {
      return res
        .status(400)
        .json({ message: 'guestId and newAvatarUrl are required.' });
    }

    const { data: updated, error } = await updateUser(guestId, {
      avatar_url: newAvatarUrl,
    });

    if (error || !updated) {
      console.error('Error updating guest avatar URL:', error);
      return res
        .status(500)
        .json({ message: 'Database error: Unable to update avatar URL.' });
    }

    // Fix ID
    fixId(updated);

    console.log(`Guest (ID: ${updated.id}) avatar updated to: ${newAvatarUrl}`);
    return res.status(200).json({
      message: 'Guest avatar updated successfully.',
      updated,
    });
  } catch (err) {
    console.error('Error in uploadGuestAvatar:', err);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

/**
 * Sign Out Guest
 */
export const signOutGuest = async (req, res) => {
  try {
    const { guestId } = req.body;

    if (!guestId) {
      return res.status(400).json({ message: 'guestId is required.' });
    }

    const { error: signOutError } = await signOutUser(guestId);
    if (signOutError) {
      return res.status(500).json({ message: 'Error signing out guest.' });
    }

    return res.status(200).json({ message: 'Guest signed out successfully.' });
  } catch (error) {
    console.error('Error signing out guest:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

/************************************************
 *  Search guests by name, email, or phone
 *  GET /api/guests/search?query=...
 ************************************************/
export const searchGuests = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query || query.trim() === '') {
      return res.status(400).json({ message: 'Query string is required.' });
    }

    const { data: guests, error } = await searchUsersByQuery(query);
    if (error) {
      console.error('searchGuests error:', error);
      return res.status(500).json({ message: 'Database error occurred.' });
    }

    if (!guests || guests.length === 0) {
      return res.status(404).json({ message: 'No matching guest found.' });
    }

    // Optionally fix IDs for each guest if your DB returns them as objects
    guests.forEach((g) => fixId(g));

    // Return all matches
    return res.json({ guests });
  } catch (err) {
    console.error('Unexpected error in searchGuests:', err);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

/************************************************
 *  Get all guests
 *  GET /api/guests
 ************************************************/
export const getAllGuests = async (req, res) => {
  try {
    const { data, error } = await getAllUsers();
    if (error) {
      console.error('Error fetching all guests:', error);
      return res
        .status(500)
        .json({ message: 'Database error fetching all guests.' });
    }

    // Optionally fix IDs for each guest
    data.forEach((g) => fixId(g));

    return res.status(200).json({ guests: data });
  } catch (err) {
    console.error('Unexpected error in getAllGuests:', err);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};
