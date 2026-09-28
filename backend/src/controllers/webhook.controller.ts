import { Request, Response } from 'express';
import { TelegramUpdate } from '../types/telegram.types';
import { config } from '../config/env';
import { botService } from '../services/bot.service';

/**
 * Handles incoming updates from the Telegram Bot API Webhook.
 * Responds with HTTP 200 immediately to adhere to Telegram timeout requirements,
 * then delegates business logic to the bot service asynchronously.
 */
export const handleTelegramWebhook = async (req: Request, res: Response): Promise<void> => {
  // Validate Telegram Secret Token header if configured
  if (config.telegramWebhookSecret) {
    const receivedSecret = req.headers['x-telegram-bot-api-secret-token'];
    if (receivedSecret !== config.telegramWebhookSecret) {
      console.warn('[Webhook] Rejected update with invalid or missing secret token header');
      res.status(403).json({ error: 'Forbidden: Invalid secret token' });
      return;
    }
  }

  const update = req.body as TelegramUpdate;

  if (!update || typeof update.update_id !== 'number') {
    res.status(400).json({ error: 'Bad Request: Invalid update payload' });
    return;
  }

  // Acknowledge update immediately to Telegram Bot API (prevent webhook delivery retries)
  res.status(200).json({ ok: true });

  // Process update asynchronously in the background
  if (update.message) {
    botService.processIncomingMessage(update.message).catch((err) => {
      console.error('[Webhook] Unhandled error during update processing:', err);
    });
  }
};
