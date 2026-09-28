import { Document, Types } from 'mongoose';

export interface IMessage {
  userId: Types.ObjectId;
  telegramMessageId: number;
  originalText: string;
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
  extractedTermsCount: number;
  isForwarded: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IMessageDocument extends IMessage, Document<Types.ObjectId> {}
