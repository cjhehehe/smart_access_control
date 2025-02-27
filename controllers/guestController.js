import { createUser, findUserByEmail, findUserById } from '../models/userModel.js';

/**
 * Register a new guest
 */
export const registerGuest = async (req, res) => {
    try {
        const { name, email, phone } = req.body;

        if (!name || !email || !phone) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        // Check if email already exists
        const { data: existingUser } = await findUserByEmail(email);
        if (existingUser) {
            return res.status(409).json({ message: 'Email already exists' });
        }

        const newUser = {
            name,
            email,
            phone,
            membership_level: 'Regular', // Default membership level
            membership_start: new Date().toISOString(), // Store as ISO timestamp
            membership_renewals: 0, // Default renewals count
        };

        console.log('Registering new guest:', newUser);
        const { data, error } = await createUser(newUser);

        if (error) {
            console.error('Database Insert Error:', error);
            return res.status(500).json({ message: 'Database error: Unable to register guest' });
        }

        res.status(201).json({ message: 'Guest registered successfully', data });
    } catch (error) {
        console.error('Unexpected Error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

/**
 * Guest Login
 */
export const loginGuest = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }

        // Find guest by email
        const { data, error } = await findUserByEmail(email);

        if (error || !data) {
            return res.status(404).json({ message: 'Guest not found' });
        }

        res.status(200).json({ message: 'Guest logged in successfully', data });
    } catch (error) {
        console.error('Unexpected login error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
