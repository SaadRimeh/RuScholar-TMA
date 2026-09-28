import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { webhookRouter } from './webhook.routes';
import { flashcardRouter } from './flashcard.routes';
import { config } from '../config/env';

const apiRouter = Router();

// Health check endpoint
apiRouter.get('/health', (_req: Request, res: Response): void => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
    database: dbStatus,
    uptimeSeconds: Math.floor(process.uptime()),
  });
});

// Mount modular sub-routers
apiRouter.use('/webhook', webhookRouter);
apiRouter.use('/flashcards', flashcardRouter);

export default apiRouter;
