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

router.get('/all', getAllRFIDTags);
router.get('/available', getAvailableRFIDTags);
router.post('/assign', assignRFID);
router.post('/activate', activateRFIDTag);
router.post('/lost', markRFIDAsLost);
router.post('/unassign', unassignRFIDTag);
router.post('/verify', verifyRFID);

export default router;
