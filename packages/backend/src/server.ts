import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import { errorHandler } from './middlewares/errorHandler';
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import sessionRoutes from './routes/sessionRoutes';
import clientRoutes from './routes/clientRoutes';
import therapistRoutes from './routes/therapistRoutes';
import appointmentRoutes from './routes/appointmentRoutes';
import phiRoutes from './routes/phiRoutes';
import insuranceRoutes from './routes/insuranceRoutes';
import onboardingRoutes from './routes/onboardingRoutes';

import { securityHeadersMiddleware } from './middlewares/security/securityHeadersMiddleware';
import { phiDetectionMiddleware } from './middlewares/security/phiDetectionMiddleware';
import { phiResponseMiddleware } from './middlewares/security/phiResponseMiddleware';

dotenv.config({
  path: process.env.NODE_ENV === 'production'
    ? '.env.production'
    : '.env.development'
});

const app = express();
const PORT = process.env.API_PORT || 4000;

// security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

app.use(securityHeadersMiddleware);
app.use(express.json({ limit: '10mb' }));
app.use(phiDetectionMiddleware);

if (process.env.ENABLE_RATE_LIMITING === 'true') {
  app.use(rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
  }));
}

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
  next();
});

app.use(phiResponseMiddleware());

// routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/therapists', therapistRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/phi', phiRoutes);
app.use('/api/insurance', insuranceRoutes);
app.use('/api/onboarding', onboardingRoutes);

// health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy' });
});

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - 404 - Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ message: 'Endpoint not found' });
});

// error handling
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
