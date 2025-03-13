import supabase from '../config/supabase.js';
import { submitFeedback, getFeedbackByGuest } from '../models/feedbackModel.js';
import { createNotification } from '../models/notificationModel.js'; // <--- Re-introduce createNotification

/**
 * Submit Feedback or Complaint
 */
export const submitGuestFeedback = async (req, res) => {
  try {
    // Destructure fields from the request body
    const { guest_id, guest_name, feedback_type, description } = req.body;

    // Validate that all required fields are provided
    if (!guest_id || !guest_name || !feedback_type || !description) {
      return res.status(400).json({
        message: 'All fields are required: guest_id, guest_name, feedback_type, description'
      });
    }

    // 1) Verify that the guest exists in the database
    const { data: guest, error: guestError } = await supabase
      .from('guests')
      .select('id, name')
      .eq('id', guest_id)
      .maybeSingle();

    if (guestError) {
      console.error('Error checking guest existence:', guestError);
      return res.status(500).json({ message: 'Error checking guest', error: guestError.message });
    }
    if (!guest) {
      return res.status(404).json({ message: 'Guest not found' });
    }

    // 2) Insert feedback into your "feedback_complaints" table
    const { data: feedbackData, error: feedbackError } = await submitFeedback({
      guest_id,
      guest_name,
      feedback_type,
      description
    });

    if (feedbackError) {
      console.error('Database Error:', feedbackError);
      return res.status(500).json({
        message: 'Database error: Unable to submit feedback',
        error: feedbackError.message
      });
    }

    // 3) Notify ALL admins that a new feedback/complaint was submitted
    try {
      const { data: allAdmins, error: adminsError } = await supabase
        .from('admins')
        .select('id'); // Adjust if your 'admins' table has a different schema

      if (adminsError) {
        console.error('Error fetching admins for notification:', adminsError);
      } else if (allAdmins && allAdmins.length > 0) {
        for (const admin of allAdmins) {
          const adminId = admin.id;
          const notifTitle = 'New Feedback/Complaint';
          const notifMessage = `Guest #${guest_id} submitted a ${feedback_type}.`;

          // Insert an admin notification
          const { error: notifError } = await createNotification({
            recipient_admin_id: adminId,
            title: notifTitle,
            message: notifMessage,
            notification_type: 'feedback', // or 'complaint', or just 'feedback'
          });

          if (notifError) {
            console.error(`Failed to notify admin ${adminId}:`, notifError);
          }
        }
      }
    } catch (notifCatchErr) {
      console.error('Unexpected error creating admin notifications:', notifCatchErr);
    }

    return res.status(201).json({
      message: 'Feedback submitted successfully',
      data: feedbackData
    });
  } catch (error) {
    console.error('Unexpected Error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Get Feedback by Guest ID
 */
export const getGuestFeedback = async (req, res) => {
  try {
    const { guest_id } = req.params;

    if (!guest_id) {
      return res.status(400).json({ message: 'Guest ID is required' });
    }

    // Retrieve feedback for the guest using your model function
    const { data, error } = await getFeedbackByGuest(guest_id);

    if (error) {
      console.error('Database Error:', error);
      return res.status(500).json({
        message: 'Database error: Unable to fetch feedback',
        error: error.message
      });
    }

    if (!data || data.length === 0) {
      return res.status(404).json({ message: 'No feedback found for this guest' });
    }

    return res.status(200).json({
      message: 'Feedback retrieved successfully',
      data
    });
  } catch (error) {
    console.error('Unexpected Error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
