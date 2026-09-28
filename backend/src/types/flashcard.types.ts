import { Document, Types } from 'mongoose';

/**
 * SuperMemo SM-2 SRS Review Grades:
 * 0 - Complete blackout
 * 1 - Incorrect response; the correct one remembered
 * 2 - Incorrect response; where the correct one seemed easy to recall
 * 3 - Correct response recalled with serious difficulty ("Hard")
 * 4 - Correct response after a hesitation ("Good")
 * 5 - Perfect response with immediate recall ("Easy")
 */
export type SRSGrade = 0 | 1 | 2 | 3 | 4 | 5;

export interface IFlashcard {
  userId: Types.ObjectId;
  messageId?: Types.ObjectId;
  originalTerm: string;
  translatedTerm: string;
  contextSentenceRu?: string;
  contextSentenceEn?: string;
  partOfSpeech?: string;
  tags: string[];

  // Spaced Repetition System (SRS) Metrics
  interval: number; // Interval in days until next review
  repetition: number; // Number of consecutive successful reviews
  easeFactor: number; // Difficulty multiplier (SM-2 standard default: 2.5, min: 1.3)
  nextReviewDate: Date; // Timestamp when flashcard becomes due
  lastReviewedAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}

export interface IFlashcardDocument extends IFlashcard, Document<Types.ObjectId> {}
