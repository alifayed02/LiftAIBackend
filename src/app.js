import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';

import routes from './routes/index.js';           // mounts /v1, /v2, etc.
import errorMiddleware from './middlewares/error.js'; // your centralized error handler

const app = express();

// Basic hardening & perf
app.set('trust proxy', 1);
app.use(helmet());
app.use(compression());

// Logging (quiet in test)
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Body parsers
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// CORS (tighten origins as needed)
const ENVIRONMENT = process.env.ENVIRONMENT || process.env.NODE_ENV || 'development';
const PORT = Number(process.env.PORT) || 3000;
const FRONTEND_URL = process.env.FRONTEND_URL;

const allowedOrigins = ENVIRONMENT === 'production'
  ? (FRONTEND_URL?.split(',') || [])
  : ['http://localhost:5173'];

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));

// Health checks
app.get('/healthz', (_req, res) => res.json({ ok: true }));

// API routes
app.use('/api', routes);

// 404 (not found) for unmatched routes
app.use((req, res, _next) => {
  res.status(404).json({ error: 'Not Found', path: req.originalUrl });
});

// Centralized error handler (must be last)
app.use(errorMiddleware);

export default app;