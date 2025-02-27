import express from 'express';
import { assignRFID, getAvailableRFIDTags, verifyRFID } from '../controllers/rfidController.js';

const router = express.Router();

// Route to assign an RFID to a guest
router.post('/assign', assignRFID);

// Route to get available (unassigned) RFID tags
router.get('/available', getAvailableRFIDTags);

// ✅ NEW: Route to verify if an RFID is valid
router.post('/verify', verifyRFID);

export default router;
