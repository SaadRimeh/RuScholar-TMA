import { Router } from 'express';
import { handleTelegramWebhook } from '../controllers/webhook.controller';

const router = Router();

// Telegram Bot Webhook receiver endpoint
router.post('/telegram', handleTelegramWebhook);

export const webhookRouter = router;
