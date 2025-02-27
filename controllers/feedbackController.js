import supabase from '../config/supabase.js';
import { submitFeedback, getFeedbackByGuest } from '../models/feedbackModel.js';

/**
 * ✅ Submit Feedback or Complaint
 */
export const submitGuestFeedback = async (req, res) => {
    try {
        const { guest_id, feedback_type, description } = req.body; 

        // ✅ Check if all required fields are present
        if (!guest_id || !feedback_type || !description) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        // ✅ Verify if guest exists
        const { data: guest, error: guestError } = await supabase
            .from('guests')
            .select('id')
            .eq('id', guest_id)
            .maybeSingle();

        if (guestError || !guest) {
            return res.status(404).json({ message: 'Guest not found' });
        }

        // ✅ Insert feedback
        const { data, error } = await submitFeedback({ 
            guest_id, 
            feedback_type, 
            description 
        });

        if (error) {
            console.error('❌ Database Error:', error);
            return res.status(500).json({ message: 'Database error: Unable to submit feedback', error: error.message });
        }

        res.status(201).json({ message: 'Feedback submitted successfully', data });

    } catch (error) {
        console.error('❌ Unexpected Error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

/**
 * ✅ Get Feedback by Guest ID
 */
export const getGuestFeedback = async (req, res) => {
    try {
        const { guest_id } = req.params;

        if (!guest_id) {
            return res.status(400).json({ message: 'Guest ID is required' });
        }

        // ✅ Retrieve feedback for the guest
        const { data, error } = await getFeedbackByGuest(guest_id);

        if (error) {
            console.error('❌ Database Error:', error);
            return res.status(500).json({ message: 'Database error: Unable to fetch feedback', error: error.message });
        }

        if (!data || data.length === 0) {
            return res.status(404).json({ message: 'No feedback found for this guest' });
        }

        res.status(200).json({ message: 'Feedback retrieved successfully', data });

    } catch (error) {
        console.error('❌ Unexpected Error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
