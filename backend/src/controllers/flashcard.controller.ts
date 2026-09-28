import { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { FlashcardModel } from '../models/Flashcard.model';
import { SRSService } from '../services/srs.service';

/**
 * Controller managing Telegram Mini App Flashcard endpoints.
 * All actions are guaranteed to have authenticated req.userDoc via requireTelegramAuth middleware.
 */
export class FlashcardController {
  /**
   * GET /api/flashcards/due
   * Retrieves flashcards that are due for review (nextReviewDate <= current time)
   * Utilizing the high-performance compound index { userId: 1, nextReviewDate: 1 }.
   */
  public static async getDueFlashcards(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const user = req.userDoc;
      if (!user) {
        res.status(401).json({ success: false, error: 'Unauthorized user context' });
        return;
      }

      const limit = Math.min(Math.max(parseInt((req.query['limit'] as string) || '20', 10), 1), 100);
      const tag = req.query['tag'] as string | undefined;

      const now = new Date();
      const filter: Record<string, unknown> = {
        userId: user._id,
        nextReviewDate: { $lte: now },
      };

      if (tag && tag.trim().length > 0) {
        filter['tags'] = tag.trim().toLowerCase();
      }

      // Fetch cards ordered by earliest due date first
      const dueCards = await FlashcardModel.find(filter)
        .sort({ nextReviewDate: 1 })
        .limit(limit)
        .lean();

      // Count total due cards for progress indicators
      const totalDue = await FlashcardModel.countDocuments(filter);

      res.status(200).json({
        success: true,
        data: {
          cards: dueCards,
          count: dueCards.length,
          totalDue,
          timestamp: now.toISOString(),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/flashcards/:id/review
   * Submits a student's review rating for a flashcard and updates its SuperMemo SM-2 SRS metrics.
   */
  public static async reviewFlashcard(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const user = req.userDoc;
      if (!user) {
        res.status(401).json({ success: false, error: 'Unauthorized user context' });
        return;
      }

      const idParam = req.params['id'];
      const id = Array.isArray(idParam) ? idParam[0] : idParam;
      if (!id || typeof id !== 'string' || !Types.ObjectId.isValid(id)) {
        res.status(400).json({ success: false, error: 'Invalid flashcard ID format' });
        return;
      }

      const { rating, grade } = req.body;
      const targetRating = grade !== undefined ? grade : rating;

      if (targetRating === undefined) {
        res.status(400).json({
          success: false,
          error: "Missing required review rating or grade (e.g. 'again', 'hard', 'good', 'easy' or 0-5)",
        });
        return;
      }

      // Map and validate grade
      const srsGrade = SRSService.mapRatingToGrade(targetRating);

      // Fetch card ensuring ownership to prevent IDOR (Insecure Direct Object Reference)
      const flashcard = await FlashcardModel.findOne({
        _id: id,
        userId: user._id,
      });

      if (!flashcard) {
        res.status(404).json({
          success: false,
          error: 'Flashcard not found or does not belong to the authenticated user',
        });
        return;
      }

      // Compute SM-2 spaced repetition values
      const srsResult = SRSService.calculateNextReview({
        repetition: flashcard.repetition,
        interval: flashcard.interval,
        easeFactor: flashcard.easeFactor,
        grade: srsGrade,
      });

      // Update card metrics
      flashcard.repetition = srsResult.repetition;
      flashcard.interval = srsResult.interval;
      flashcard.easeFactor = srsResult.easeFactor;
      flashcard.nextReviewDate = srsResult.nextReviewDate;
      flashcard.lastReviewedAt = new Date();

      await flashcard.save();

      res.status(200).json({
        success: true,
        message: 'Flashcard review recorded successfully',
        data: flashcard,
        reviewSummary: {
          grade: srsGrade,
          newRepetition: srsResult.repetition,
          newIntervalDays: srsResult.interval,
          newEaseFactor: srsResult.easeFactor,
          nextReviewDate: srsResult.nextReviewDate.toISOString(),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/flashcards
   * Retrieves all flashcards belonging to the student with pagination, search, and tag filtering.
   */
  public static async getAllFlashcards(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const user = req.userDoc;
      if (!user) {
        res.status(401).json({ success: false, error: 'Unauthorized user context' });
        return;
      }

      const page = Math.max(parseInt((req.query['page'] as string) || '1', 10), 1);
      const limit = Math.min(Math.max(parseInt((req.query['limit'] as string) || '20', 10), 1), 100);
      const search = (req.query['search'] as string | undefined)?.trim();
      const tag = (req.query['tag'] as string | undefined)?.trim();

      const filter: Record<string, unknown> = { userId: user._id };

      if (tag) {
        filter['tags'] = tag.toLowerCase();
      }

      if (search) {
        filter['$or'] = [
          { originalTerm: { $regex: search, $options: 'i' } },
          { translatedTerm: { $regex: search, $options: 'i' } },
        ];
      }

      const skip = (page - 1) * limit;

      const [cards, total] = await Promise.all([
        FlashcardModel.find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        FlashcardModel.countDocuments(filter),
      ]);

      res.status(200).json({
        success: true,
        data: {
          cards,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit) || 1,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/flashcards/stats
   * Provides learning statistics and SRS deck health metrics for the student's dashboard.
   */
  public static async getFlashcardStats(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const user = req.userDoc;
      if (!user) {
        res.status(401).json({ success: false, error: 'Unauthorized user context' });
        return;
      }

      const now = new Date();

      const [totalCount, dueCount, masteredCount, learningCount, newCount] = await Promise.all([
        FlashcardModel.countDocuments({ userId: user._id }),
        FlashcardModel.countDocuments({ userId: user._id, nextReviewDate: { $lte: now } }),
        FlashcardModel.countDocuments({ userId: user._id, repetition: { $gte: 5 } }),
        FlashcardModel.countDocuments({ userId: user._id, repetition: { $gt: 0, $lt: 5 } }),
        FlashcardModel.countDocuments({ userId: user._id, repetition: 0 }),
      ]);

      res.status(200).json({
        success: true,
        data: {
          totalCards: totalCount,
          dueToday: dueCount,
          masteredCards: masteredCount,
          learningCards: learningCount,
          newCards: newCount,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/flashcards/:id
   * Removes a flashcard from the student's deck.
   */
  public static async deleteFlashcard(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const user = req.userDoc;
      if (!user) {
        res.status(401).json({ success: false, error: 'Unauthorized user context' });
        return;
      }

      const idParam = req.params['id'];
      const id = Array.isArray(idParam) ? idParam[0] : idParam;
      if (!id || typeof id !== 'string' || !Types.ObjectId.isValid(id)) {
        res.status(400).json({ success: false, error: 'Invalid flashcard ID format' });
        return;
      }

      const deleted = await FlashcardModel.findOneAndDelete({
        _id: id,
        userId: user._id,
      });

      if (!deleted) {
        res.status(404).json({ success: false, error: 'Flashcard not found' });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Flashcard removed successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}
