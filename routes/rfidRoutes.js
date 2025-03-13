// routes/rfidRoutes.js
import express from 'express';
import {
  getAllRFIDTags,
  getAvailableRFIDTags,
  assignRFID,
  activateRFIDTag,
  markRFIDAsLost,
  unassignRFIDTag,
  verifyRFID,
} from '../controllers/rfidController.js';

const router = express.Router();

// Admin usage: fetch all tags
router.get('/all', getAllRFIDTags);

// Guest usage: fetch only 'available' tags
router.get('/available', getAvailableRFIDTags);

// Assign a card (status -> 'assigned')
router.post('/assign', assignRFID);

// Activate a card (status -> 'active')
router.post('/activate', activateRFIDTag);

// Mark as lost (status -> 'lost')
router.post('/lost', markRFIDAsLost);

// Unassign (status -> 'available')
router.post('/unassign', unassignRFIDTag);

// Verify (check if it's valid/active + correct room)
router.post('/verify', verifyRFID);

export default router;
