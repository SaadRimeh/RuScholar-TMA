import { TelegramUser } from './telegram.types';
import { IUserDocument } from './user.types';

declare module 'express-serve-static-core' {
  interface Request {
    telegramUser?: TelegramUser;
    userDoc?: IUserDocument;
  }
}

declare global {
  namespace Express {
    interface Request {
      telegramUser?: TelegramUser;
      userDoc?: IUserDocument;
    }
  }
}
