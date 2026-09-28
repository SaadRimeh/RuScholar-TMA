import { Router, Request, Response } from 'express';
import { requireTelegramAuth } from '../middlewares/validateInitData';

const router = Router();

// Protect all flashcard routes with Telegram initData HMAC-SHA-256 validation
router.use(requireTelegramAuth);

/**
 * Health check & session verification endpoint for the Telegram Mini App.
 * Returns the authenticated Telegram user profile and associated MongoDB record.
 */
router.get('/session', (req: Request, res: Response): void => {
  res.status(200).json({
    success: true,
    data: {
      telegramUser: req.telegramUser,
      user: req.userDoc,
    },
  });
});

export const flashcardRouter = router;
