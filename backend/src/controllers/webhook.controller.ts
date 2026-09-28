import { Request, Response } from 'express';
import { TelegramUpdate } from '../types/telegram.types';
import { config } from '../config/env';

/**
 * Handles incoming updates from the Telegram Bot API Webhook.
 * Responds with HTTP 200 immediately to adhere to Telegram timeout requirements.
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

  // Acknowledge update immediately to Telegram Bot API
  res.status(200).json({ ok: true });

  // Process update asynchronously (Task 2 will connect this to bot service layer)
  try {
    if (update.message) {
      console.log(
        `[Webhook] Received message id ${update.message.message_id} from user ${update.message.from?.id} (${update.message.from?.first_name}): "${update.message.text?.slice(0, 50) ?? '[Non-text content]'}"`
      );
    }
  } catch (err) {
    console.error('[Webhook] Error processing update payload:', err);
  }
};
