import express from 'express';
import { submitGuestFeedback, getGuestFeedback } from '../controllers/feedbackController.js';

const router = express.Router();

// POST /api/feedback/submit -> create a feedback/complaint
router.post('/submit', submitGuestFeedback);

// GET /api/feedback/guest/:guest_id -> fetch a guest's feedback
router.get('/guest/:guest_id', getGuestFeedback);

export default router;
