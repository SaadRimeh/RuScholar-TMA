import { Schema, model } from 'mongoose';
import { IFlashcardDocument } from '../types/flashcard.types';

const FlashcardSchema = new Schema<IFlashcardDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is mandatory'],
      index: true,
    },
    messageId: {
      type: Schema.Types.ObjectId,
      ref: 'Message',
      required: false,
      index: true,
    },
    originalTerm: {
      type: String,
      required: [true, 'Original Russian academic term is mandatory'],
      trim: true,
    },
    translatedTerm: {
      type: String,
      required: [true, 'Translated term is mandatory'],
      trim: true,
    },
    contextSentenceRu: {
      type: String,
      trim: true,
    },
    contextSentenceEn: {
      type: String,
      trim: true,
    },
    partOfSpeech: {
      type: String,
      trim: true,
    },
    tags: {
      type: [String],
      default: [],
      index: true,
    },

    // Spaced Repetition System (SRS) - SuperMemo SM-2 Metric Fields
    interval: {
      type: Number,
      default: 0,
      min: 0,
    },
    repetition: {
      type: Number,
      default: 0,
      min: 0,
    },
    easeFactor: {
      type: Number,
      default: 2.5,
      min: 1.3,
    },
    nextReviewDate: {
      type: Date,
      default: Date.now,
      index: true,
    },
    lastReviewedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// High-performance compound index for fetching due cards: find({ userId, nextReviewDate: { $lte: now } }).sort({ nextReviewDate: 1 })
FlashcardSchema.index({ userId: 1, nextReviewDate: 1 });

// High-performance compound index to check/prevent duplicate terms per user
FlashcardSchema.index({ userId: 1, originalTerm: 1 });

export const FlashcardModel = model<IFlashcardDocument>('Flashcard', FlashcardSchema);
