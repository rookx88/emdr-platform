// packages/backend/src/server.ts
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

// Security middleware
import { securityHeadersMiddleware } from './middlewares/security/securityHeadersMiddleware';
import { phiDetectionMiddleware } from './middlewares/security/phiDetectionMiddleware';
import { phiResponseMiddleware } from './middlewares/security/phiResponseMiddleware';

// Load environment variables
dotenv.config({ 
  path: process.env.NODE_ENV === 'production' 
    ? '.env.production' 
    : '.env.development' 
});

const app = express();
const PORT = process.env.API_PORT || 4000;

// Security middleware
app.use(helmet()); // Set security headers
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// Apply security headers middleware
app.use(securityHeadersMiddleware);

// Increase payload size limit for audio data
app.use(express.json({ limit: '10mb' })); // Increased from 1mb to 10mb

// Apply PHI detection middleware for request processing
app.use(phiDetectionMiddleware);

// Rate limiting for security
if (process.env.ENABLE_RATE_LIMITING === 'true') {
  app.use(rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
  }));
}

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
  next();
});

// Apply PHI response middleware for all routes
app.use(phiResponseMiddleware());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/therapists', therapistRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/phi', phiRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy' });
});

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - 404 - Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ message: 'Endpoint not found' });
});

// Error handling middleware
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;