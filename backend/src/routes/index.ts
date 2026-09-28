import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { webhookRouter } from './webhook.routes';
import { flashcardRouter } from './flashcard.routes';
import { config } from '../config/env';

import axios from 'axios';

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

// Russian text-to-speech audio stream endpoint
apiRouter.get('/tts', async (req: Request, res: Response): Promise<void> => {
  const text = (req.query.text as string)?.trim();
  if (!text) {
    res.status(400).send('Missing text parameter');
    return;
  }

  try {
    const sanitizedText = text.slice(0, 150);
    const googleTtsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=ru&client=tw-ob&q=${encodeURIComponent(
      sanitizedText
    )}`;

    const response = await axios.get(googleTtsUrl, {
      responseType: 'stream',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      timeout: 8000,
    });

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    response.data.pipe(res);
  } catch (error) {
    console.warn('[TTS Endpoint] Failed to generate TTS audio:', (error as Error).message);
    res.status(500).send('TTS Generation Failed');
  }
});

// Mount modular sub-routers
apiRouter.use('/webhook', webhookRouter);
apiRouter.use('/flashcards', flashcardRouter);

export default apiRouter;
