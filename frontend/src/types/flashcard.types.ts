export type SRSGrade = 0 | 1 | 2 | 3 | 4 | 5;
export type SRSRating = 'again' | 'hard' | 'good' | 'easy';

export interface IFlashcard {
  _id: string;
  userId: string;
  messageId?: string;
  originalTerm: string;
  translatedTerm: string;
  contextSentenceRu?: string;
  contextSentenceEn?: string;
  partOfSpeech?: string;
  tags: string[];

  // Spaced Repetition Metrics (SM-2)
  interval: number;
  repetition: number;
  easeFactor: number;
  nextReviewDate: string;
  lastReviewedAt?: string;

  createdAt: string;
  updatedAt: string;
}

export interface DeckStats {
  totalCards: number;
  dueToday: number;
  masteredCards: number;
  learningCards: number;
  newCards: number;
}

export interface ReviewResponse {
  success: boolean;
  message: string;
  data: IFlashcard;
  reviewSummary: {
    grade: SRSGrade;
    newRepetition: number;
    newIntervalDays: number;
    newEaseFactor: number;
    nextReviewDate: string;
  };
}

export interface DueCardsResponse {
  success: boolean;
  data: {
    cards: IFlashcard[];
    count: number;
    totalDue: number;
    timestamp: string;
  };
}

export interface AllCardsResponse {
  success: boolean;
  data: {
    cards: IFlashcard[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

export interface StatsResponse {
  success: boolean;
  data: DeckStats;
}
