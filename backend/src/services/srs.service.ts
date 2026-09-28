import { SRSGrade } from '../types/flashcard.types';

export interface SRSReviewInput {
  repetition: number;
  interval: number;
  easeFactor: number;
  grade: SRSGrade;
}

export interface SRSReviewOutput {
  repetition: number;
  interval: number;
  easeFactor: number;
  nextReviewDate: Date;
}

export class SRSService {
  public static readonly MIN_EASE_FACTOR = 1.3;
  public static readonly DEFAULT_EASE_FACTOR = 2.5;

  /**
   * Calculates the next review schedule using the SuperMemo SM-2 algorithm.
   *
   * @param input Current card SRS metrics and review grade (0-5)
   * @returns Updated SRS metrics and computed nextReviewDate
   */
  public static calculateNextReview(input: SRSReviewInput): SRSReviewOutput {
    const { repetition, interval, easeFactor, grade } = input;

    // Validate grade bounds
    if (grade < 0 || grade > 5) {
      throw new Error(`Invalid SRS grade: ${grade}. Grade must be an integer between 0 and 5.`);
    }

    let nextRepetition: number;
    let nextInterval: number;

    // Update Ease Factor (EF)
    // Formula: EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
    const qDiff = 5 - grade;
    let nextEaseFactor = easeFactor + (0.1 - qDiff * (0.08 + qDiff * 0.02));

    // Clamp ease factor to minimum threshold
    if (nextEaseFactor < this.MIN_EASE_FACTOR) {
      nextEaseFactor = this.MIN_EASE_FACTOR;
    }
    // Round to 2 decimal places for clean storage
    nextEaseFactor = Math.round(nextEaseFactor * 100) / 100;

    // Determine repetition count and interval in days
    if (grade < 3) {
      // Failed recall / reset cycle: review again in 1 day (or immediate review)
      nextRepetition = 0;
      nextInterval = 1;
    } else {
      // Successful recall
      if (repetition === 0) {
        nextInterval = 1;
      } else if (repetition === 1) {
        nextInterval = 6;
      } else {
        nextInterval = Math.round(interval * nextEaseFactor);
      }
      nextRepetition = repetition + 1;
    }

    // Compute future due date (now + nextInterval in days)
    const nextReviewDate = new Date();
    nextReviewDate.setMinutes(nextReviewDate.getMinutes() + nextInterval * 24 * 60);

    return {
      repetition: nextRepetition,
      interval: nextInterval,
      easeFactor: nextEaseFactor,
      nextReviewDate,
    };
  }

  /**
   * Helper to map human-readable UI rating strings into SM-2 numerical grades:
   * 'again' -> 0 (Blackout / Complete failure)
   * 'hard'  -> 3 (Correct recall with serious difficulty)
   * 'good'  -> 4 (Correct recall with standard effort)
   * 'easy'  -> 5 (Instant recall / Mastered)
   */
  public static mapRatingToGrade(rating: string | number): SRSGrade {
    if (typeof rating === 'number') {
      if (rating >= 0 && rating <= 5) {
        return Math.round(rating) as SRSGrade;
      }
      throw new Error(`Numeric rating ${rating} is out of bounds (0-5).`);
    }

    switch (rating.trim().toLowerCase()) {
      case 'again':
      case 'repeat':
      case 'fail':
        return 0;
      case 'hard':
      case 'difficult':
        return 3;
      case 'good':
      case 'normal':
        return 4;
      case 'easy':
      case 'perfect':
        return 5;
      default:
        throw new Error(
          `Invalid rating string: "${rating}". Expected 'again', 'hard', 'good', or 'easy'.`
        );
    }
  }
}
