import express from 'express';
import { assignRFID, getAvailableRFIDTags } from '../controllers/rfidController.js';

const router = express.Router();

router.post('/assign', assignRFID);
router.get('/available', getAvailableRFIDTags);

export default router;
