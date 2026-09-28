import dotenv from 'dotenv';
import path from 'path';

// Load .env configuration
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

export interface AppConfig {
  port: number;
  nodeEnv: 'development' | 'production' | 'test';
  mongoUri: string;
  telegramBotToken: string;
  telegramWebhookSecret: string;
  telegramWebhookUrl: string;
  clientOrigin: string;
  yandexApiKey: string;
  yandexFolderId: string;
  telegramMiniAppUrl: string;
}

const getEnv = (key: string, defaultValue?: string): string => {
  const value = process.env[key] || defaultValue;
  if (value === undefined) {
    throw new Error(`[Config Error] Missing required environment variable: ${key}`);
  }
  return value;
};

export const config: AppConfig = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: (process.env.NODE_ENV as 'development' | 'production' | 'test') || 'development',
  mongoUri: getEnv('MONGODB_URI', 'mongodb://localhost:27017/ruscholar'),
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN || '',
  telegramWebhookSecret: process.env.TELEGRAM_WEBHOOK_SECRET || '',
  telegramWebhookUrl: process.env.TELEGRAM_WEBHOOK_URL || '',
  clientOrigin: process.env.CLIENT_ORIGIN || '*',
  yandexApiKey: process.env.YANDEX_API_KEY || '',
  yandexFolderId: process.env.YANDEX_FOLDER_ID || '',
  telegramMiniAppUrl: process.env.TELEGRAM_MINI_APP_URL || 'https://ru-scholar-tma.vercel.app',
};
