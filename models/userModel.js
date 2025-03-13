// models/userModel.js

import supabase from '../config/supabase.js';

/**
 * Find guest by email (assumes email is unique).
 * Returns a single object or null.
 */
export const findUserByEmail = async (email) => {
  try {
    const { data, error } = await supabase
      .from('guests')
      .select(`
        id,
        name,
        email,
        phone,
        password,
        membership_level,
        membership_start,
        membership_renewals,
        avatar_url
      `)
      .eq('email', email)
      .maybeSingle(); // Typically email is unique

    if (error) {
      console.error('Error finding user by email:', error);
      return { data: null, error };
    }
    // data is a single object or null
    return { data, error: null };
  } catch (err) {
    console.error('Unexpected error in findUserByEmail:', err);
    return { data: null, error: err };
  }
};

/**
 * Find guest(s) by phone (may return multiple rows).
 * We remove .maybeSingle() so that data is always an array.
 */
export const findUserByPhone = async (phone) => {
  try {
    // This query can return multiple rows if phone is not unique
    const { data, error } = await supabase
      .from('guests')
      .select(`
        id,
        name,
        email,
        phone,
        password,
        membership_level,
        membership_start,
        membership_renewals,
        avatar_url
      `)
      .eq('phone', phone);

    if (error) {
      console.error('Error finding user by phone:', error);
      return { data: null, error };
    }
    // data is an array (could be empty, could have 1 row, or multiple rows)
    return { data, error: null };
  } catch (err) {
    console.error('Unexpected error in findUserByPhone:', err);
    return { data: null, error: err };
  }
};

/**
 * Find guest by ID (assumes id is unique).
 */
export const findUserById = async (id) => {
  try {
    const { data, error } = await supabase
      .from('guests')
      .select(`
        id,
        name,
        email,
        phone,
        password,
        membership_level,
        membership_start,
        membership_renewals,
        avatar_url
      `)
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('Error finding user by ID:', error);
      return { data: null, error };
    }
    return { data, error: null };
  } catch (err) {
    console.error('Unexpected error in findUserById:', err);
    return { data: null, error: err };
  }
};

/**
 * Create a new guest (row) in the 'guests' table
 */
export const createUser = async (userData) => {
  try {
    const { data, error } = await supabase
      .from('guests')
      .insert([userData])
      .select(`
        id,
        name,
        email,
        phone,
        password,
        membership_level,
        membership_start,
        membership_renewals,
        avatar_url
      `)
      .single();

    if (error) {
      console.error('Supabase Insert Error:', error.message);
      return { data: null, error };
    }
    return { data, error: null };
  } catch (err) {
    console.error('Unexpected error in createUser:', err);
    return { data: null, error: err };
  }
};

/**
 * Update a guest record by ID with the specified fields
 */
export const updateUser = async (id, updateFields) => {
  try {
    const { data, error } = await supabase
      .from('guests')
      .update(updateFields)
      .eq('id', id)
      .select(`
        id,
        name,
        email,
        phone,
        password,
        membership_level,
        membership_start,
        membership_renewals,
        avatar_url
      `)
      .maybeSingle();

    if (error) {
      console.error('Supabase Update Error:', error);
      return { data: null, error };
    }
    return { data, error: null };
  } catch (err) {
    console.error('Unexpected error in updateUser:', err);
    return { data: null, error: err };
  }
};

/**
 * Sign out a guest by ID (placeholder).
 */
export const signOutUser = async (guestId) => {
  try {
    // If you store sessions/tokens, revoke them here.
    // For now, just a placeholder that always succeeds.
    return { error: null };
  } catch (err) {
    console.error('Error signing out user:', err);
    return { error: err };
  }
};

/**
 * Search for guests by name, email, or phone (ILIKE)
 */
export const searchUsersByQuery = async (query) => {
  try {
    const { data, error } = await supabase
      .from('guests')
      .select(`
        id,
        name,
        email,
        phone,
        password,
        membership_level,
        membership_start,
        membership_renewals,
        avatar_url
      `)
      .or(`name.ilike.%${query}%,email.ilike.%${query}%,phone.ilike.%${query}%`);

    if (error) {
      console.error('searchUsersByQuery error:', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (err) {
    console.error('Unexpected error in searchUsersByQuery:', err);
    return { data: null, error: err };
  }
};

/**
 * Get ALL guests from the 'guests' table.
 */
export const getAllUsers = async () => {
  try {
    const { data, error } = await supabase
      .from('guests')
      .select('*'); // or specify columns if needed

    if (error) {
      console.error('Error fetching all guests:', error);
      return { data: null, error };
    }
    return { data, error: null };
  } catch (err) {
    console.error('Unexpected error in getAllUsers:', err);
    return { data: null, error: err };
  }
};
