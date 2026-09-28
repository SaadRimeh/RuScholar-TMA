import { Schema, model } from 'mongoose';
import { IMessageDocument } from '../types/message.types';

const MessageSchema = new Schema<IMessageDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID reference is mandatory'],
      index: true,
    },
    telegramMessageId: {
      type: Number,
      required: [true, 'Telegram Message ID is mandatory'],
    },
    originalText: {
      type: String,
      required: [true, 'Original Russian text is mandatory'],
      trim: true,
    },
    translatedText: {
      type: String,
      required: [true, 'Translated text is mandatory'],
      trim: true,
    },
    sourceLanguage: {
      type: String,
      default: 'ru',
      trim: true,
    },
    targetLanguage: {
      type: String,
      default: 'en',
      trim: true,
    },
    extractedTermsCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    isForwarded: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Compound indexes for fast lookup and chronological message queries
MessageSchema.index({ userId: 1, createdAt: -1 });
MessageSchema.index({ userId: 1, telegramMessageId: 1 });

export const MessageModel = model<IMessageDocument>('Message', MessageSchema);
