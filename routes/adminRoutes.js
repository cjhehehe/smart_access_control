// routes/adminRoutes.js

import express from 'express';
import {
  createAdmin,
  loginAdmin,
  changeAdminPassword,
  updateAdminProfile,
  uploadAdminAvatar,
  signOutAdmin,
} from '../controllers/adminController.js';

// We’ll also import a new controller to get all admins
import { getAllAdminsController } from '../controllers/adminController.js';

const router = express.Router();

// Existing routes
router.post('/create', createAdmin);
router.post('/login', loginAdmin);
router.post('/change_password', changeAdminPassword);
router.post('/edit_profile', updateAdminProfile);
router.post('/upload_avatar', uploadAdminAvatar);
router.post('/sign_out', signOutAdmin);

// ✅ New route: GET /api/admins
router.get('/', getAllAdminsController);

export default router;
