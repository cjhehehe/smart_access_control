import express from 'express';
import { submitServiceRequest } from '../controllers/serviceRequestController.js';

const router = express.Router();

router.post('/submit', submitServiceRequest);

export default router;
