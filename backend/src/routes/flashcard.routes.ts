import { Router, Request, Response } from 'express';
import { requireTelegramAuth } from '../middlewares/validateInitData';
import { FlashcardController } from '../controllers/flashcard.controller';

const router = Router();

// Protect all flashcard routes with Telegram initData HMAC-SHA-256 validation
router.use(requireTelegramAuth);

/**
 * GET /api/flashcards/session
 * Returns authenticated session profile and synchronized user entity.
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

/**
 * GET /api/flashcards/due
 * Retrieves flashcards due for spaced repetition review (nextReviewDate <= now).
 */
router.get('/due', FlashcardController.getDueFlashcards);

/**
 * GET /api/flashcards/stats
 * Returns overall deck progress and mastery statistics for the student.
 */
router.get('/stats', FlashcardController.getFlashcardStats);

/**
 * GET /api/flashcards
 * Lists all flashcards for the user with pagination and optional search/tag filter.
 */
router.get('/', FlashcardController.getAllFlashcards);

/**
 * POST /api/flashcards/:id/review
 * Submits a review grade/rating and advances the card's SM-2 interval.
 */
router.post('/:id/review', FlashcardController.reviewFlashcard);

/**
 * DELETE /api/flashcards/:id
 * Deletes a flashcard belonging to the student.
 */
router.delete('/:id', FlashcardController.deleteFlashcard);

export const flashcardRouter = router;
