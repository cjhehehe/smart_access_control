import supabase from '../config/supabase.js';

/**
 * Find guest by email
 */
export const findUserByEmail = async (email) => {
    try {
        const { data, error } = await supabase
            .from('guests')
            .select('id, name, email, phone, membership_level, membership_start, membership_renewals')
            .eq('email', email)
            .maybeSingle();

        if (error) {
            console.error('Error finding user by email:', error);
            return { data: null, error };
        }
        return { data };
    } catch (err) {
        console.error('Unexpected error in findUserByEmail:', err);
        return { data: null, error: err };
    }
};

/**
 * Find guest by ID
 */
export const findUserById = async (id) => {
    try {
        const { data, error } = await supabase
            .from('guests')
            .select('id, name, email')
            .eq('id', id)
            .maybeSingle();

        if (error) {
            console.error('Error finding user by ID:', error);
            return { data: null, error };
        }
        return { data };
    } catch (err) {
        console.error('Unexpected error in findUserById:', err);
        return { data: null, error: err };
    }
};

/**
 * Create a new guest
 */
export const createUser = async (userData) => {
    try {
        const { data, error } = await supabase
            .from('guests')
            .insert([userData])
            .select('id, name, email, phone, membership_level')
            .single();

        if (error) {
            console.error('Supabase Insert Error:', error.message);
            return { data: null, error };
        }
        return { data };
    } catch (err) {
        console.error('Unexpected error in createUser:', err);
        return { data: null, error: err };
    }
};
