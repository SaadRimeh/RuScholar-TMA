import axios from 'axios';
import { config } from '../config/env';
import { AcademicAnalysisResult } from '../types/academic.types';

export interface InlineKeyboardButton {
  text: string;
  url?: string;
  web_app?: {
    url: string;
  };
  callback_data?: string;
}

export class TelegramService {
  private readonly baseUrl: string;

  constructor() {
    this.baseUrl = `https://api.telegram.org/bot${config.telegramBotToken}`;
  }

  /**
   * Dispatches a chat action indicator (e.g. 'typing') to Telegram.
   */
  public async sendChatAction(
    chatId: number,
    action: 'typing' | 'upload_document' = 'typing'
  ): Promise<void> {
    if (!config.telegramBotToken) return;

    try {
      await axios.post(`${this.baseUrl}/sendChatAction`, {
        chat_id: chatId,
        action,
      });
    } catch (error) {
      console.warn('[Telegram Service] Failed to send chat action:', (error as Error).message);
    }
  }

  /**
   * Sends an HTML-formatted message to a user/chat with optional inline keyboard.
   */
  public async sendMessage(
    chatId: number,
    text: string,
    replyMarkup?: { inline_keyboard: InlineKeyboardButton[][] }
  ): Promise<void> {
    if (!config.telegramBotToken) {
      console.log(`[Telegram Service - Mock Mode] Message to chat ${chatId}:\n${text}`);
      return;
    }

    try {
      await axios.post(
        `${this.baseUrl}/sendMessage`,
        {
          chat_id: chatId,
          text,
          parse_mode: 'HTML',
          disable_web_page_preview: true,
          ...(replyMarkup ? { reply_markup: replyMarkup } : {}),
        },
        { timeout: 10000 }
      );
    } catch (error) {
      console.error(
        `[Telegram Service] Failed to send message to chat ${chatId}:`,
        (error as Error).message
      );
    }
  }

  /**
   * Sends the introductory /start welcome message with instructions and Mini App launch button.
   */
  public async sendWelcomeMessage(chatId: number, firstName: string): Promise<void> {
    const text = `
🎓 <b>Welcome to RuScholar, ${firstName}!</b>

RuScholar is your AI-powered academic assistant for studying in Russia.

<b>How to use:</b>
1. <b>Forward any academic announcement</b>, lab task, or chat message from professors/dean's office into this bot.
2. The bot will automatically <b>translate</b> the text and <b>extract key academic terms</b>.
3. Extracted terms are automatically saved as <b>Spaced Repetition (SRS) Flashcards</b>.
4. Launch the <b>RuScholar Mini App</b> below at any time to review your cards and master university Russian!
`;

    const inlineKeyboard = {
      inline_keyboard: [
        [
          {
            text: '🚀 Open RuScholar Mini App',
            web_app: { url: config.telegramMiniAppUrl },
          },
        ],
      ],
    };

    await this.sendMessage(chatId, text.trim(), inlineKeyboard);
  }

  /**
   * Sends academic analysis breakdown back to the user upon processing forwarded text.
   */
  public async sendAcademicAnalysis(
    chatId: number,
    analysis: AcademicAnalysisResult,
    savedCardsCount: number
  ): Promise<void> {
    let termsList = '';
    analysis.terms.forEach((term, idx) => {
      const tags = term.tags && term.tags.length > 0 ? ` <i>[${term.tags.join(', ')}]</i>` : '';
      termsList += `\n${idx + 1}. <b>${term.originalTerm}</b> ➔ <i>${term.translatedTerm}</i>${tags}`;
    });

    const text = `
📚 <b>Academic Analysis & Translation</b>

<b>Original text:</b>
<blockquote>${escapeHtml(analysis.originalText.slice(0, 400))}${analysis.originalText.length > 400 ? '...' : ''}</blockquote>

<b>Translation (${analysis.targetLanguage.toUpperCase()}):</b>
<blockquote>${escapeHtml(analysis.translatedText.slice(0, 500))}${analysis.translatedText.length > 500 ? '...' : ''}</blockquote>

<b>Extracted Academic Vocabulary:</b>${termsList || '\n<i>No specific technical terms detected.</i>'}

✅ <b>${savedCardsCount} new flashcard(s)</b> generated and added to your Spaced Repetition deck!
`;

    const inlineKeyboard = {
      inline_keyboard: [
        [
          {
            text: '🗂 Review Flashcards in Mini App',
            web_app: { url: config.telegramMiniAppUrl },
          },
        ],
      ],
    };

    await this.sendMessage(chatId, text.trim(), inlineKeyboard);
  }
}

/**
 * Escapes characters for Telegram HTML mode.
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export const telegramService = new TelegramService();
