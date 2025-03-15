// server.js

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { apiLimiter } from './middlewares/rateLimitMiddleware.js';

// Routes
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
import macAddressRoutes from './routes/macAddressRoutes.js';

// Error handling
import { errorHandler } from './middlewares/errorHandler.js';

dotenv.config();
const app = express();

// -------------------------------------------------------
// 1) Core Middlewares
// -------------------------------------------------------
app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(apiLimiter);

// -------------------------------------------------------
// 2) Mount Routes
// -------------------------------------------------------
app.use('/api/auth', authRoutes);
app.use('/api/guests', guestRoutes);
app.use('/api/admins', adminRoutes);

// The RFID routes include the new PUT /update-status endpoint:
app.use('/api/rfid', rfidRoutes);

app.use('/api/service-requests', serviceRequestRoutes);
app.use('/api/rooms', roomsRoutes);
app.use('/api/access-logs', accessLogRoutes);
app.use('/api/activity-logs', activityLogRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/mac-address', macAddressRoutes);

// -------------------------------------------------------
// 3) Error Handling
// -------------------------------------------------------
app.use(errorHandler);

// -------------------------------------------------------
// 4) Start Server
// -------------------------------------------------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
