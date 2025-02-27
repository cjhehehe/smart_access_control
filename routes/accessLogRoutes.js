import express from 'express';
import { logAccessAttempt, getAccessLogsByGuest } from '../controllers/accessLogController.js';

const router = express.Router();

router.post('/log', logAccessAttempt);
router.get('/:guest_id', getAccessLogsByGuest);

export default router;
