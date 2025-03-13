import supabase from '../config/supabase.js';
import bcrypt from 'bcryptjs';

/**
 * ✅ Create Admin
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
      .limit(1);

    if (findError) {
      console.error("❌ Error checking existing admins:", findError);
      return res.status(500).json({ message: 'Database error while checking admins' });
    }

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
 * ✅ Login Admin
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

/**
 * ✅ Change Admin Password
 */
export const changeAdminPassword = async (req, res) => {
  try {
    const { adminId, currentPassword, newPassword } = req.body;
    if (!adminId || !currentPassword || !newPassword) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    // 1) Fetch admin
    const { data: admin, error } = await supabase
      .from('admins')
      .select('id, password')
      .eq('id', adminId)
      .maybeSingle();

    if (error || !admin) {
      return res.status(404).json({ message: 'Admin not found.' });
    }

    // 2) Compare currentPassword with hashed password
    const isMatch = await bcrypt.compare(currentPassword, admin.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Incorrect current password.' });
    }

    // 3) Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // 4) Update DB
    const { error: updateError } = await supabase
      .from('admins')
      .update({ password: hashedPassword })
      .eq('id', adminId);

    if (updateError) {
      return res.status(500).json({ message: 'Error updating password.' });
    }

    return res.status(200).json({ message: 'Password updated successfully.' });
  } catch (err) {
    console.error('❌ Error changing admin password:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

/**
 * ✅ Update Admin Profile
 */
export const updateAdminProfile = async (req, res) => {
  try {
    const { adminId, username, email, role } = req.body;
    if (!adminId) {
      return res.status(400).json({ message: 'adminId is required.' });
    }

    const validRoles = ['superadmin', 'admin', 'manager'];
    if (role && !validRoles.includes(role)) {
      return res.status(400).json({ message: 'Invalid role provided.' });
    }

    const updateData = {};
    if (username) updateData.username = username;
    if (email) updateData.email = email;
    if (role) updateData.role = role;

    const { error } = await supabase
      .from('admins')
      .update(updateData)
      .eq('id', adminId);

    if (error) {
      console.error('❌ Error updating admin profile:', error);
      return res.status(500).json({
        message: 'Database error: Unable to update admin profile'
      });
    }

    console.log(`✅ Admin (ID: ${adminId}) profile updated successfully.`);
    res.status(200).json({ message: 'Admin profile updated successfully.' });
  } catch (err) {
    console.error('❌ Unexpected error updating admin profile:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

/**
 * ✅ Upload Admin Avatar
 * (Minimal example that sets 'avatar_url' if you pass a direct URL.)
 *
 * If you want to handle file uploads or base64 images, you'd do that here.
 */
export const uploadAdminAvatar = async (req, res) => {
  try {
    const { adminId, newAvatarUrl } = req.body;
    if (!adminId || !newAvatarUrl) {
      return res.status(400).json({
        message: 'adminId and newAvatarUrl are required.'
      });
    }

    // Update the 'avatar_url' column
    const { error } = await supabase
      .from('admins')
      .update({ avatar_url: newAvatarUrl })
      .eq('id', adminId);

    if (error) {
      console.error('❌ Error updating admin avatar URL:', error);
      return res.status(500).json({
        message: 'Database error: Unable to update avatar URL'
      });
    }

    console.log(`✅ Admin (ID: ${adminId}) avatar updated to: ${newAvatarUrl}`);
    return res.status(200).json({
      message: 'Admin avatar updated successfully.',
      avatarUrl: newAvatarUrl,
    });
  } catch (err) {
    console.error('❌ Error in uploadAdminAvatar:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

export const signOutAdmin = async (req, res) => {
  try {
    // If using sessions or token storage, remove/expire them here.
    // For demonstration, we'll just return success:
    return res.status(200).json({ message: 'Admin signed out successfully.' });
  } catch (error) {
    console.error('❌ Error signing out admin:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};