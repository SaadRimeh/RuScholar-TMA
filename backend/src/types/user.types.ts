import { Document, Types } from 'mongoose';

export interface IUser {
  telegramId: number;
  username?: string;
  firstName: string;
  lastName?: string;
  languageCode: string;
  targetLanguage: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserDocument extends IUser, Document<Types.ObjectId> {}
