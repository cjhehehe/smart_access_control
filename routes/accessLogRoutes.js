import express from 'express';
import { logAccessGranted, logAccessDenied, getAccessLogsByGuest } from '../controllers/accessLogController.js';

const router = express.Router();

// Separate endpoints for granted and denied access logs
router.post('/granted', logAccessGranted);
router.post('/denied', logAccessDenied);
router.get('/:guest_id', getAccessLogsByGuest);

export default router;
