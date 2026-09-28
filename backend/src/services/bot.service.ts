import { TelegramWebhookMessage } from '../types/telegram.types';
import { UserModel } from '../models/User.model';
import { MessageModel } from '../models/Message.model';
import { FlashcardModel } from '../models/Flashcard.model';
import { llmService } from './llm.service';
import { telegramService } from './telegram.service';
import { config } from '../config/env';

export class BotService {
  /**
   * Main entry point for processing incoming messages forwarded to or sent to the Telegram Bot.
   */
  public async processIncomingMessage(message: TelegramWebhookMessage): Promise<void> {
    const chatId = message.chat.id;
    const from = message.from;

    if (!from) {
      console.warn('[Bot Service] Received message without sender info. Skipping.');
      return;
    }

    const text = message.text?.trim() || '';

    // Handle /start command
    if (text === '/start' || text.startsWith('/start ')) {
      await this.handleStartCommand(from, chatId);
      return;
    }

    // Handle /help command
    if (text === '/help' || text.startsWith('/help ')) {
      await this.handleHelpCommand(chatId);
      return;
    }

    // If message contains text, process as academic input
    if (text.length > 0) {
      await this.handleAcademicMessage(from, message);
    } else {
      await telegramService.sendMessage(
        chatId,
        'ℹ️ Please forward or send a <b>text message</b> containing academic Russian material to translate and extract terms.'
      );
    }
  }

  /**
   * Greets new or returning users and synchronizes user profile in MongoDB.
   */
  private async handleStartCommand(
    from: NonNullable<TelegramWebhookMessage['from']>,
    chatId: number
  ): Promise<void> {
    await this.syncUser(from);
    await telegramService.sendWelcomeMessage(chatId, from.first_name);
  }

  /**
   * Provides guidance on how to forward university announcements.
   */
  private async handleHelpCommand(chatId: number): Promise<void> {
    const helpText = `
📖 <b>RuScholar Bot Guide:</b>

• <b>Forward Messages</b>: Forward announcements from your university or faculty groups (e.g. thesis deadlines, lab schedules).
• <b>Direct Text</b>: Paste any Russian academic passage directly here.
• <b>Flashcards & SRS</b>: Every detected technical term automatically enters your Spaced Repetition deck.
• <b>Mini App</b>: Open the RuScholar Mini App anytime to review your vocabulary with scientific intervals.
`;
    await telegramService.sendMessage(chatId, helpText.trim(), {
      inline_keyboard: [
        [
          {
            text: '🚀 Open RuScholar Mini App',
            web_app: { url: config.telegramMiniAppUrl },
          },
        ],
      ],
    });
  }

  /**
   * Orchestrates the complete translation, LLM extraction, and persistence pipeline.
   */
  private async handleAcademicMessage(
    from: NonNullable<TelegramWebhookMessage['from']>,
    message: TelegramWebhookMessage
  ): Promise<void> {
    const chatId = message.chat.id;
    const text = message.text!;

    // 1. Indicate typing status to user
    await telegramService.sendChatAction(chatId, 'typing');

    try {
      // 2. Sync or retrieve user from database
      const user = await this.syncUser(from);

      // 3. Perform academic translation and LLM terminology extraction
      const analysis = await llmService.analyzeAcademicText(
        text,
        user.targetLanguage || 'en'
      );

      // 4. Persist message record in MongoDB
      const isForwarded = Boolean(
        message.forward_from || message.forward_from_chat || message.forward_date
      );

      const messageDoc = await MessageModel.create({
        userId: user._id,
        telegramMessageId: message.message_id,
        originalText: text,
        translatedText: analysis.translatedText,
        sourceLanguage: analysis.sourceLanguage,
        targetLanguage: analysis.targetLanguage,
        extractedTermsCount: analysis.terms.length,
        isForwarded,
      });

      // 5. Persist extracted terms as Flashcards with default SM-2 Spaced Repetition parameters
      let newCardsCount = 0;
      for (const term of analysis.terms) {
        const normalizedTerm = term.originalTerm.trim().toLowerCase();
        if (!normalizedTerm) continue;

        // Upsert flashcard: preserve existing SRS metrics if card already exists, update context
        const result = await FlashcardModel.findOneAndUpdate(
          { userId: user._id, originalTerm: normalizedTerm },
          {
            $setOnInsert: {
              userId: user._id,
              originalTerm: normalizedTerm,
              interval: 0,
              repetition: 0,
              easeFactor: 2.5,
              nextReviewDate: new Date(),
            },
            $set: {
              messageId: messageDoc._id,
              translatedTerm: term.translatedTerm.trim(),
              contextSentenceRu: term.contextSentenceRu?.trim() || '',
              contextSentenceEn: term.contextSentenceEn?.trim() || '',
              partOfSpeech: term.partOfSpeech?.trim() || 'noun',
              tags: term.tags || ['academic'],
            },
          },
          { upsert: true, new: true }
        );

        if (result) {
          newCardsCount++;
        }
      }

      // 6. Reply to user with formatted translation, extracted terms, and launch button
      await telegramService.sendAcademicAnalysis(chatId, analysis, newCardsCount);
    } catch (error) {
      console.error('[Bot Service] Error handling academic message:', error);
      await telegramService.sendMessage(
        chatId,
        '⚠️ An error occurred while analyzing your academic text. Please try again in a few moments.'
      );
    }
  }

  /**
   * Helper to upsert and keep Telegram user profile synchronized in MongoDB.
   */
  private async syncUser(from: NonNullable<TelegramWebhookMessage['from']>) {
    return UserModel.findOneAndUpdate(
      { telegramId: from.id },
      {
        $setOnInsert: {
          telegramId: from.id,
          targetLanguage: 'en',
        },
        $set: {
          firstName: from.first_name,
          ...(from.last_name ? { lastName: from.last_name } : {}),
          ...(from.username ? { username: from.username } : {}),
          ...(from.language_code ? { languageCode: from.language_code } : {}),
        },
      },
      { upsert: true, new: true, runValidators: true }
    );
  }
}

export const botService = new BotService();
