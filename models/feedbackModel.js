import supabase from '../config/supabase.js';

/**
 * Insert Guest Feedback
 */
export const submitFeedback = async (feedbackData) => {
  try {
    // Provide a default status if none is supplied
    if (!feedbackData.status) {
      feedbackData.status = 'pending';
    }

    // Insert into your "feedback_complaints" table
    const { data, error } = await supabase
      .from('feedback_complaints')
      .insert([feedbackData])
      .select('id, guest_id, guest_name, feedback_type, description, status, created_at')
      .single();

    if (error) {
      console.error('Supabase Insert Error:', error.message);
      return { data: null, error };
    }
    return { data, error: null };
  } catch (err) {
    console.error('Unexpected Error in submitFeedback:', err);
    return { data: null, error: err };
  }
};

/**
 * Retrieve Feedback by Guest ID
 */
export const getFeedbackByGuest = async (guest_id) => {
  try {
    const { data, error } = await supabase
      .from('feedback_complaints')
      .select('id, guest_id, guest_name, feedback_type, description, status, created_at')
      .eq('guest_id', guest_id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Database Error:', error);
      return { data: null, error };
    }
    return { data, error: null };
  } catch (err) {
    console.error('Unexpected Error in getFeedbackByGuest:', err);
    return { data: null, error: err };
  }
};
