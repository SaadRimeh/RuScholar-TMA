/**
 * Telegram User object representation as supplied by Bot API and Mini App initData
 */
export interface TelegramUser {
  id: number;
  is_bot?: boolean;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
  allows_write_to_pm?: boolean;
}

/**
 * Incoming message entity from Telegram Webhook update
 */
export interface TelegramWebhookMessage {
  message_id: number;
  from?: TelegramUser;
  date: number;
  chat: {
    id: number;
    type: 'private' | 'group' | 'supergroup' | 'channel';
    first_name?: string;
    last_name?: string;
    username?: string;
  };
  text?: string;
  forward_from?: TelegramUser;
  forward_from_chat?: {
    id: number;
    title?: string;
    type: string;
  };
  forward_date?: number;
}

/**
 * Standard Telegram Webhook Update payload
 */
export interface TelegramUpdate {
  update_id: number;
  message?: TelegramWebhookMessage;
  edited_message?: TelegramWebhookMessage;
}
