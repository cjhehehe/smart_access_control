import express from 'express';
import { createAdmin, loginAdmin } from '../controllers/adminController.js';

const router = express.Router();

// ✅ Allow admins to be created without authentication
router.post('/create', createAdmin);

// ✅ Admin login (no token required)
router.post('/login', loginAdmin);

export default router;
