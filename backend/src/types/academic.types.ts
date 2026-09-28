import { IFlashcardDocument } from './flashcard.types';
import { IMessageDocument } from './message.types';

export interface ExtractedTerm {
  originalTerm: string;
  translatedTerm: string;
  contextSentenceRu?: string;
  contextSentenceEn?: string;
  partOfSpeech?: string;
  tags?: string[];
}

export interface AcademicAnalysisResult {
  originalText: string;
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
  terms: ExtractedTerm[];
}

export interface ProcessedAcademicMessage {
  messageDoc: IMessageDocument;
  createdCardsCount: number;
  flashcards: IFlashcardDocument[];
}
