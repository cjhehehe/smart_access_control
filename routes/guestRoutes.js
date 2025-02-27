import express from 'express';
import { registerGuest, loginGuest } from '../controllers/guestController.js';

const router = express.Router();

router.post('/register', registerGuest);
router.post('/login', loginGuest);

export default router;
