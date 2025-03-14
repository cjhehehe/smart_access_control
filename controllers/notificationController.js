// controllers/notificationController.js
import {
  createNotification,
  getNotificationsByGuest,
  getNotificationsByAdmin,
  markNotificationAsRead,
  deleteNotification
} from '../models/notificationModel.js';

/**
 * Create a new notification (for Guest)
 */
export const createNewNotification = async (req, res) => {
  try {
    const {
      recipient_guest_id,
      title,
      message,
      notification_type, // optional
      note_message       // NEW optional field
    } = req.body;

    if (!recipient_guest_id || !title || !message) {
      return res.status(400).json({
        message: 'Missing required fields: recipient_guest_id, title, message'
      });
    }

    const { data, error } = await createNotification({
      recipient_guest_id,
      title,
      message,
      note_message,       // pass it along
      notification_type
    });

    if (error) {
      return res.status(500).json({
        message: 'Database error: Unable to create notification',
        error: error.message
      });
    }

    return res.status(201).json({
      message: 'Notification created successfully',
      data
    });
  } catch (err) {
    console.error('Unexpected Error in createNewNotification:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Create a new notification (for Admin)
 */
export const createAdminNotification = async (req, res) => {
  try {
    const {
      recipient_admin_id,
      title,
      message,
      notification_type, // optional
      note_message       // NEW optional field
    } = req.body;

    if (!recipient_admin_id || !title || !message) {
      return res.status(400).json({
        message: 'Missing required fields: recipient_admin_id, title, message'
      });
    }

    const { data, error } = await createNotification({
      recipient_admin_id,
      title,
      message,
      note_message,       // pass it along
      notification_type
    });

    if (error) {
      return res.status(500).json({
        message: 'Database error: Unable to create admin notification',
        error: error.message
      });
    }

    return res.status(201).json({
      message: 'Admin notification created successfully',
      data
    });
  } catch (err) {
    console.error('Unexpected Error in createAdminNotification:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Get notifications for a specific guest
 */
export const getGuestNotifications = async (req, res) => {
  try {
    const { guest_id } = req.params;
    if (!guest_id) {
      return res.status(400).json({ message: 'Guest ID is required' });
    }

    const { data, error } = await getNotificationsByGuest(guest_id);
    if (error) {
      return res.status(500).json({
        message: 'Database error: Unable to fetch notifications',
        error: error.message
      });
    }

    if (!data || data.length === 0) {
      return res.status(404).json({ message: 'No notifications found for this guest' });
    }

    return res.status(200).json({
      message: 'Notifications retrieved successfully',
      notifications: data
    });
  } catch (err) {
    console.error('Unexpected Error in getGuestNotifications:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Get notifications for a specific admin
 */
export const getAdminNotifications = async (req, res) => {
  try {
    const { admin_id } = req.params;
    if (!admin_id) {
      return res.status(400).json({ message: 'Admin ID is required' });
    }

    const { data, error } = await getNotificationsByAdmin(admin_id);
    if (error) {
      return res.status(500).json({
        message: 'Database error: Unable to fetch admin notifications',
        error: error.message
      });
    }

    if (!data || data.length === 0) {
      return res.status(404).json({ message: 'No notifications found for this admin' });
    }

    return res.status(200).json({
      message: 'Admin notifications retrieved successfully',
      notifications: data
    });
  } catch (err) {
    console.error('Unexpected Error in getAdminNotifications:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Mark a single notification as read
 */
export const markNotifRead = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ message: 'Notification ID is required' });
    }

    const { data, error } = await markNotificationAsRead(id);
    if (error) {
      return res.status(500).json({
        message: 'Database error: Unable to mark notification as read',
        error: error.message
      });
    }
    if (!data) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    return res.status(200).json({
      message: 'Notification marked as read',
      data
    });
  } catch (err) {
    console.error('Unexpected Error in markNotifRead:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Delete a notification
 */
export const removeNotification = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ message: 'Notification ID is required' });
    }

    const { data, error } = await deleteNotification(id);
    if (error) {
      return res.status(500).json({
        message: 'Database error: Unable to delete notification',
        error: error.message
      });
    }
    if (!data) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    return res.status(200).json({
      message: 'Notification deleted successfully',
      data
    });
  } catch (err) {
    console.error('Unexpected Error in removeNotification:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
