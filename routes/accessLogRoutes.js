// routes/accessLogsRoutes.js
import express from 'express';
import {
  logAccessGranted,
  logAccessDenied,
  getAccessLogsByGuest
} from '../controllers/accessLogController.js';

const router = express.Router();

// RFID Access Logs
router.post('/granted', logAccessGranted);
router.post('/denied', logAccessDenied);
router.get('/:guest_id', getAccessLogsByGuest);

export default router;
