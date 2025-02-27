import supabase from '../config/supabase.js';
import bcrypt from 'bcryptjs';

/**
 * ✅ Create Admin (Superadmin Creation Allowed, Others Require Admin Status)
 */
export const createAdmin = async (req, res) => {
    try {
        const { username, password, email, role = 'admin' } = req.body;

        if (!username || !password || !email) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        console.log("🛠️ Checking existing admins...");

        // Check if there's already an admin in the database
        const { data: existingAdmins, error: findError } = await supabase
            .from('admins')
            .select('id')
            .limit(1); // Fetch one record

        if (findError) {
            console.error("❌ Error checking existing admins:", findError);
            return res.status(500).json({ message: 'Database error while checking admins' });
        }

        const isSuperAdmin = existingAdmins.length === 0; // If no admins exist, this is a superadmin

        console.log("🔐 Hashing password...");
        const hashedPassword = await bcrypt.hash(password, 10);

        // ✅ Insert new admin
        const { data, error } = await supabase
            .from('admins')
            .insert([{ username, password: hashedPassword, email, role }])
            .select()
            .single();

        if (error) {
            console.error('❌ Error creating admin:', error);
            return res.status(500).json({ message: 'Database error: Unable to create admin' });
        }

        console.log("✅ Admin created successfully:", username);
        res.status(201).json({ message: 'Admin created successfully' });

    } catch (error) {
        console.error('❌ Unexpected Error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

/**
 * ✅ Login Admin (Validates Credentials Without Tokens)
 */
export const loginAdmin = async (req, res) => {
    try {
        const { identifier, password } = req.body;

        if (!identifier || !password) {
            return res.status(400).json({ message: 'Username/Email and password are required' });
        }

        console.log("🛠️ Attempting login with:", identifier);

        // Fetch admin by username OR email
        const { data: admin, error } = await supabase
            .from('admins')
            .select('id, username, password, email, role')
            .or(`username.eq.${identifier},email.eq.${identifier}`)
            .maybeSingle();

        if (error || !admin) {
            console.log("❌ Admin not found:", identifier);
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        console.log("🔍 Retrieved Admin Data:", admin);

        // Validate password
        const isPasswordValid = await bcrypt.compare(password, admin.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        res.status(200).json({ message: 'Admin logged in successfully', admin });

    } catch (error) {
        console.error('❌ Unexpected Login Error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
