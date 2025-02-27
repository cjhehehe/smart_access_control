import express from 'express';
import { submitGuestFeedback, getGuestFeedback } from '../controllers/feedbackController.js';

const router = express.Router();

router.post('/submit', submitGuestFeedback);
router.get('/guest/:guest_id', getGuestFeedback);

export default router;
