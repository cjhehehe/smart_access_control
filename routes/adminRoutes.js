// routes/adminRoutes.js

import express from 'express';
import {
  createAdmin,
  loginAdmin,
  changeAdminPassword,
  updateAdminProfile,
  uploadAdminAvatar,
  signOutAdmin, // <-- import our new signOutAdmin
} from '../controllers/adminController.js';

const router = express.Router();

// ✅ Existing routes
router.post('/create', createAdmin);
router.post('/login', loginAdmin);
router.post('/change_password', changeAdminPassword);
router.post('/edit_profile', updateAdminProfile);
router.post('/upload_avatar', uploadAdminAvatar);

// ✅ New sign-out route
router.post('/sign_out', signOutAdmin);

export default router;
