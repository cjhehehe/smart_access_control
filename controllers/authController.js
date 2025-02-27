import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import supabase from '../config/supabase.js';

dotenv.config();

export const loginAdmin = async (req, res) => {
    try {
        const { identifier, password } = req.body; // Accept username or email

        if (!identifier || !password) {
            return res.status(400).json({ message: 'Username/Email and password are required' });
        }

        console.log("🛠️ Logging in as:", identifier);

        const { data: admin, error } = await supabase
            .from('admins')
            .select('id, username, password, email, role')
            .or(`username.eq.${identifier},email.eq.${identifier}`)
            .maybeSingle();

        if (error || !admin) {
            console.log("❌ Admin not found:", error);
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        console.log("🔍 Admin Retrieved:", admin);

        // Validate password
        const isPasswordValid = await bcrypt.compare(password, admin.password);
        console.log("🔐 Password Match Result:", isPasswordValid);

        if (!isPasswordValid) {
            console.log("❌ Incorrect Password");
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { id: admin.id, role: admin.role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.ACCESS_TOKEN_EXPIRY || '1h' }
        );

        console.log("✅ Admin login successful:", admin.username);
        res.json({ message: 'Login successful', token });
    } catch (error) {
        console.error("❌ Unexpected error during login:", error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
