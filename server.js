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
import accessLogRoutes from './routes/accessLogRoutes.js';
import feedbackRoutes from './routes/feedbackRoutes.js';

import { logAccessGranted, logAccessDenied } from './controllers/accessLogController.js';
import { errorHandler } from './middlewares/errorHandler.js';

dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(apiLimiter); // Apply rate limiting globally

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/guests', guestRoutes);
app.use('/api/admins', adminRoutes);
app.use('/api/rfid', rfidRoutes);
app.use('/api/service-requests', serviceRequestRoutes);
app.use('/api/access-logs', accessLogRoutes);
app.use('/api/feedback', feedbackRoutes);

// Additional API Endpoints for Access Logging
app.post('/api/access-logs/granted', logAccessGranted);
app.post('/api/access-logs/denied', logAccessDenied);

// Error Handling Middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
