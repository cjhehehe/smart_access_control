// models/notificationModel.js

import supabase from '../config/supabase.js';
import { DateTime } from 'luxon';

/**
 * Create a new notification
 * @param {Object} notifData
 *  - recipient_guest_id (int, optional)
 *  - recipient_admin_id (int, optional)
 *  - title (string, required)
 *  - message (string, required)
 *  - note_message (string, optional)
 *  - notification_type (string, optional)
 *  - is_read (bool, optional; default = false)
 */
export const createNotification = async (notifData) => {
  try {
    // Default is_read to false if not provided
    if (notifData.is_read === undefined) {
      notifData.is_read = false;
    }

    // Generate local Asia/Manila time in "YYYY-MM-DD HH:mm:ss" format
    const localManilaTime = DateTime.now()
      .setZone('Asia/Manila')
      .toFormat('yyyy-MM-dd HH:mm:ss');

    // Insert into 'notifications' table
    const { data, error } = await supabase
      .from('notifications')
      .insert([
        {
          recipient_guest_id: notifData.recipient_guest_id ?? null,
          recipient_admin_id: notifData.recipient_admin_id ?? null,
          title: notifData.title,
          message: notifData.message,
          note_message: notifData.note_message ?? null, // Insert the new column
          notification_type: notifData.notification_type ?? null,
          is_read: notifData.is_read,
          created_at: localManilaTime, // Local time string (Asia/Manila)
        },
      ])
      .select('*')
      .single();

    if (error) {
      console.error('createNotification() Error:', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (err) {
    console.error('Unexpected Error in createNotification():', err);
    return { data: null, error: err };
  }
};

/**
 * Get notifications by Guest ID
 * @param {number} guest_id
 */
export const getNotificationsByGuest = async (guest_id) => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*') // includes note_message
      .eq('recipient_guest_id', guest_id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('getNotificationsByGuest() Error:', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (err) {
    console.error('Unexpected Error in getNotificationsByGuest():', err);
    return { data: null, error: err };
  }
};

/**
 * Get notifications by Admin ID
 * @param {number} admin_id
 */
export const getNotificationsByAdmin = async (admin_id) => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*') // includes note_message
      .eq('recipient_admin_id', admin_id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('getNotificationsByAdmin() Error:', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (err) {
    console.error('Unexpected Error in getNotificationsByAdmin():', err);
    return { data: null, error: err };
  }
};

/**
 * Mark a notification as read
 * @param {number} notif_id
 */
export const markNotificationAsRead = async (notif_id) => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notif_id)
      .select('*')
      .single();

    if (error) {
      console.error('markNotificationAsRead() Error:', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (err) {
    console.error('Unexpected Error in markNotificationAsRead():', err);
    return { data: null, error: err };
  }
};

/**
 * Delete a notification
 * @param {number} notif_id
 */
export const deleteNotification = async (notif_id) => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notif_id)
      .select('*')
      .single();

    if (error) {
      console.error('deleteNotification() Error:', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (err) {
    console.error('Unexpected Error in deleteNotification():', err);
    return { data: null, error: err };
  }
};
