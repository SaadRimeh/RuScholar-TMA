import { apiClient } from './client';
import type {
  DueCardsResponse,
  ReviewResponse,
  StatsResponse,
  AllCardsResponse,
  SRSRating,
  SRSGrade,
  DeckStats,
} from '../types/flashcard.types';

export const flashcardsApi = {
  /**
   * Fetches flashcards currently due for spaced repetition review.
   */
  async getDueFlashcards(limit: number = 20, tag?: string): Promise<DueCardsResponse['data']> {
    const params: Record<string, string | number> = { limit };
    if (tag) params['tag'] = tag;

    const response = await apiClient.get<DueCardsResponse>('/flashcards/due', { params });
    return response.data.data;
  },

  /**
   * Submits a student review rating ('again', 'hard', 'good', 'easy' or 0-5)
   * and updates the card's SM-2 interval and repetition count.
   */
  async submitReview(
    flashcardId: string,
    rating: SRSRating | SRSGrade
  ): Promise<ReviewResponse> {
    const body = typeof rating === 'number' ? { grade: rating } : { rating };
    const response = await apiClient.post<ReviewResponse>(
      `/flashcards/${flashcardId}/review`,
      body
    );
    return response.data;
  },

  /**
   * Retrieves overall deck statistics and mastery distribution.
   */
  async getStats(): Promise<DeckStats> {
    const response = await apiClient.get<StatsResponse>('/flashcards/stats');
    return response.data.data;
  },

  /**
   * Browses the student's full flashcard collection with pagination and search.
   */
  async getAllFlashcards(params?: {
    page?: number;
    limit?: number;
    search?: string;
    tag?: string;
  }): Promise<AllCardsResponse['data']> {
    const response = await apiClient.get<AllCardsResponse>('/flashcards', {
      params,
    });
    return response.data.data;
  },

  /**
   * Verifies current Telegram Mini App authentication session.
   */
  async checkSession(): Promise<{ success: boolean; data: unknown }> {
    const response = await apiClient.get<{ success: boolean; data: unknown }>(
      '/flashcards/session'
    );
    return response.data;
  },

  /**
   * Deletes a flashcard from the student's deck.
   */
  async deleteCard(flashcardId: string): Promise<void> {
    await apiClient.delete(`/flashcards/${flashcardId}`);
  },
};
