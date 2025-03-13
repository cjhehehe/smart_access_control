// routes/macAddressRoutes.js
import express from 'express';
import {
  logMacAddress,
  getWhitelistedMacsList,
  updateMacAddressStatus,
} from '../controllers/macAddressController.js';

const router = express.Router();

// POST /api/mac-address/log
router.post('/log', logMacAddress);

// GET /api/mac-address/whitelisted
router.get('/whitelisted', getWhitelistedMacsList);

// POST /api/mac-address/update-status
router.post('/update-status', updateMacAddressStatus);

export default router;
