import { Schema, model } from 'mongoose';
import { IUserDocument } from '../types/user.types';

const UserSchema = new Schema<IUserDocument>(
  {
    telegramId: {
      type: Number,
      required: [true, 'Telegram ID is mandatory'],
      unique: true,
      index: true,
    },
    username: {
      type: String,
      trim: true,
      index: true,
      sparse: true,
    },
    firstName: {
      type: String,
      required: [true, 'First name is mandatory'],
      trim: true,
    },
    lastName: {
      type: String,
      trim: true,
    },
    languageCode: {
      type: String,
      default: 'ru',
      trim: true,
    },
    targetLanguage: {
      type: String,
      default: 'en',
      trim: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export const UserModel = model<IUserDocument>('User', UserSchema);
