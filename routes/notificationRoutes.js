// routes/notificationRoutes.js
import express from 'express';
import {
  createNewNotification,
  createAdminNotification,
  getGuestNotifications,
  getAdminNotifications,
  markNotifRead,
  removeNotification
} from '../controllers/notificationController.js';

const router = express.Router();

// POST /api/notifications  (for Guest)
router.post('/', createNewNotification);

// POST /api/notifications/admin  (for Admin)
router.post('/admin', createAdminNotification);

// GET /api/notifications/guest/:guest_id
router.get('/guest/:guest_id', getGuestNotifications);

// GET /api/notifications/admin/:admin_id
router.get('/admin/:admin_id', getAdminNotifications);

// PUT /api/notifications/:id/mark-read
router.put('/:id/mark-read', markNotifRead);

// DELETE /api/notifications/:id
router.delete('/:id', removeNotification);

export default router;
