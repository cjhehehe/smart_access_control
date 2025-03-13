// server.js
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { apiLimiter } from './middlewares/rateLimitMiddleware.js';

import authRoutes from './routes/authRoutes.js';
import guestRoutes from './routes/guestRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import rfidRoutes from './routes/rfidRoutes.js';
import serviceRequestRoutes from './routes/serviceRequestRoutes.js';
import roomsRoutes from './routes/roomsRoutes.js';
import accessLogRoutes from './routes/accessLogRoutes.js';
import activityLogRoutes from './routes/activityLogRoutes.js';
import feedbackRoutes from './routes/feedbackRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';

// NEW
import macAddressRoutes from './routes/macAddressRoutes.js';

import { errorHandler } from './middlewares/errorHandler.js';

dotenv.config();
const app = express();

// Accept JSON bodies
app.use(express.json());
// (Optional) If you want form-encoded, also do:
// app.use(express.urlencoded({ extended: true }));

app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(apiLimiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/guests', guestRoutes);
app.use('/api/admins', adminRoutes);
app.use('/api/rfid', rfidRoutes);
app.use('/api/service-requests', serviceRequestRoutes);
app.use('/api/rooms', roomsRoutes);
app.use('/api/access-logs', accessLogRoutes);
app.use('/api/activity-logs', activityLogRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/notifications', notificationRoutes);

// NEW: MAC address
app.use('/api/mac-address', macAddressRoutes);

// Error Handling
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
