import express, { Application } from 'express';
import cors from 'cors';
import apiRouter from './routes';
import { notFoundHandler } from './middlewares/notFound';
import { errorHandler } from './middlewares/errorHandler';
import { config } from './config/env';

export const createApp = (): Application => {
  const app = express();

  // Basic security and parsing middlewares
  // Dynamic CORS supporting Telegram Webviews, Vercel deployments, and local dev
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (like mobile webviews, curl, telegram bot API)
        if (!origin) return callback(null, true);
        if (
          config.clientOrigin === '*' ||
          origin === config.clientOrigin ||
          origin.endsWith('.vercel.app') ||
          origin.includes('localhost') ||
          origin.includes('telegram.org') ||
          origin.includes('t.me')
        ) {
          return callback(null, true);
        }
        return callback(null, true);
      },
      credentials: true,
    })
  );

  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Root welcome / ping
  app.get('/', (_req, res) => {
    res.status(200).json({
      message: 'RuScholar TMA Backend API is running.',
      version: '1.0.0',
    });
  });

  // Mount API endpoints
  app.use('/api', apiRouter);

  // Fallback handlers
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
