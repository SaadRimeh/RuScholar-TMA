import axios from 'axios';
import { config } from '../config/env';
import { AcademicAnalysisResult, ExtractedTerm } from '../types/academic.types';

export class LLMService {
  private readonly yandexApiUrl = 'https://llm.api.cloud.yandex.net/foundationModels/v1/completion';

  /**
   * Translates academic Russian text and extracts key academic/technical terminology
   * along with contextual sentences, parts of speech, and domain tags.
   */
  public async analyzeAcademicText(
    russianText: string,
    targetLanguage: string = 'en'
  ): Promise<AcademicAnalysisResult> {
    const trimmedText = russianText.trim();
    if (!trimmedText) {
      throw new Error('Input text cannot be empty');
    }

    // If Yandex Cloud credentials are configured, query YandexGPT Foundation Model
    if (config.yandexApiKey && config.yandexFolderId) {
      try {
        return await this.callYandexGPT(trimmedText, targetLanguage);
      } catch (error) {
        console.warn(
          '[LLM Service] YandexGPT API call failed or unavailable. Falling back to built-in academic extractor:',
          (error as Error).message
        );
      }
    }

    // Robust heuristic / dictionary fallback for development, testing, and offline resilience
    return this.fallbackAcademicExtractor(trimmedText, targetLanguage);
  }

  /**
   * Queries Yandex Cloud Foundation Models (YandexGPT) for structured translation & extraction.
   */
  private async callYandexGPT(
    russianText: string,
    targetLanguage: string
  ): Promise<AcademicAnalysisResult> {
    const systemPrompt = `You are an elite academic Russian-to-${targetLanguage} translator and technical terminology extraction specialist for university students in the Russian Federation.
Given Russian academic text (lecture announcements, lab instructions, syllabus notes, thesis requirements), perform:
1. High-accuracy academic translation of the entire text to ${targetLanguage}.
2. Identification of 3 to 7 key domain-specific technical terms, concepts, or academic phrases.
3. For each term, extract:
   - "originalTerm": term in Russian (lemma/canonical form).
   - "translatedTerm": accurate academic translation in ${targetLanguage}.
   - "contextSentenceRu": sentence from the input text containing this term.
   - "contextSentenceEn": translation of that sentence.
   - "partOfSpeech": e.g., "noun", "noun phrase", "verb", "adjective".
   - "tags": 1-2 relevant academic domain tags (e.g. "mathematics", "computer science", "physics", "thesis", "deadline").

Return ONLY valid JSON matching this schema with NO markdown codeblocks or commentary:
{
  "translatedText": "full translation here",
  "terms": [
    {
      "originalTerm": "термин",
      "translatedTerm": "term",
      "contextSentenceRu": "sentence in ru",
      "contextSentenceEn": "sentence in en",
      "partOfSpeech": "noun phrase",
      "tags": ["tag1", "tag2"]
    }
  ]
}`;

    const payload = {
      modelUri: `gpt://${config.yandexFolderId}/yandexgpt/latest`,
      completionOptions: {
        stream: false,
        temperature: 0.2,
        maxTokens: '2000',
      },
      messages: [
        { role: 'system', text: systemPrompt },
        { role: 'user', text: russianText },
      ],
    };

    const response = await axios.post(this.yandexApiUrl, payload, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Api-Key ${config.yandexApiKey}`,
        'x-folder-id': config.yandexFolderId,
      },
      timeout: 15000,
    });

    const rawContent: string =
      response.data?.result?.alternatives?.[0]?.message?.text || '';

    // Strip markdown fences if returned
    const cleanedJson = rawContent
      .replace(/```json/gi, '')
      .replace(/```/g, '')
      .trim();

    const parsed = JSON.parse(cleanedJson) as {
      translatedText?: string;
      terms?: ExtractedTerm[];
    };

    return {
      originalText: russianText,
      translatedText: parsed.translatedText || '[Translation unavailable]',
      sourceLanguage: 'ru',
      targetLanguage,
      terms: Array.isArray(parsed.terms) ? parsed.terms : [],
    };
  }

  /**
   * Resilient fallback academic parser. Deconstructs sentences, maps academic keywords,
   * and creates initial flashcards even when external LLM credentials are intentionally unconfigured.
   */
  private fallbackAcademicExtractor(
    text: string,
    targetLanguage: string
  ): AcademicAnalysisResult {
    // Academic dictionary of prevalent Russian university/STEM terms
    const academicDictionary: Record<
      string,
      { en: string; pos: string; tags: string[] }
    > = {
      'курсовая работа': { en: 'coursework / term project', pos: 'noun phrase', tags: ['academics', 'projects'] },
      'дипломная работа': { en: 'graduation thesis', pos: 'noun phrase', tags: ['thesis', 'graduation'] },
      'научный руководитель': { en: 'academic advisor / supervisor', pos: 'noun phrase', tags: ['administration', 'research'] },
      'лабораторная работа': { en: 'laboratory assignment', pos: 'noun phrase', tags: ['lab', 'practical'] },
      'зачёт': { en: 'pass/fail assessment (credit)', pos: 'noun', tags: ['exams', 'grading'] },
      'экзамен': { en: 'examination', pos: 'noun', tags: ['exams', 'grading'] },
      'сессия': { en: 'examination session / finals period', pos: 'noun', tags: ['calendar', 'exams'] },
      'деканат': { en: "dean's office", pos: 'noun', tags: ['administration'] },
      'расписание': { en: 'schedule / timetable', pos: 'noun', tags: ['calendar'] },
      'дифференциальное уравнение': { en: 'differential equation', pos: 'noun phrase', tags: ['mathematics', 'calculus'] },
      'алгоритм': { en: 'algorithm', pos: 'noun', tags: ['computer science'] },
      'база данных': { en: 'database', pos: 'noun phrase', tags: ['computer science'] },
      'преподаватель': { en: 'lecturer / instructor', pos: 'noun', tags: ['faculty'] },
      'кафедра': { en: 'academic department / faculty chair', pos: 'noun', tags: ['administration'] },
      'дедлайн': { en: 'deadline', pos: 'noun', tags: ['assignment', 'deadline'] },
      'срок сдачи': { en: 'submission deadline', pos: 'noun phrase', tags: ['assignment', 'deadline'] },
      'конспект': { en: 'lecture notes', pos: 'noun', tags: ['study', 'lectures'] },
      'доклад': { en: 'presentation / report', pos: 'noun', tags: ['academics', 'speech'] },
      'исследование': { en: 'research / study', pos: 'noun', tags: ['research', 'science'] },
      'практическое занятие': { en: 'seminar / practical class', pos: 'noun phrase', tags: ['study', 'classes'] },
    };

    const sentences = text
      .split(/(?<=[.!?])\s+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const extractedTerms: ExtractedTerm[] = [];
    const lowerText = text.toLowerCase();

    // Check predefined academic terms
    for (const [term, meta] of Object.entries(academicDictionary)) {
      if (lowerText.includes(term)) {
        const matchingSentence = sentences.find((s) =>
          s.toLowerCase().includes(term)
        );

        extractedTerms.push({
          originalTerm: term,
          translatedTerm: meta.en,
          contextSentenceRu: matchingSentence || text,
          contextSentenceEn: `Context: ${matchingSentence || text}`,
          partOfSpeech: meta.pos,
          tags: meta.tags,
        });
      }
    }

    // If no predefined terms matched, extract capitalized or prominent Russian noun candidates
    if (extractedTerms.length === 0) {
      const words = text
        .split(/[\s,.;:!?()«»"]+/)
        .map((w) => w.trim())
        .filter((w) => w.length > 4 && /[а-яёА-ЯЁ]/.test(w));

      const uniqueWords = Array.from(new Set(words)).slice(0, 3);
      for (const word of uniqueWords) {
        const sentence = sentences.find((s) => s.includes(word)) || text;
        extractedTerms.push({
          originalTerm: word.toLowerCase(),
          translatedTerm: `[Academic term: ${word}]`,
          contextSentenceRu: sentence,
          contextSentenceEn: `Academic context in Russian: "${sentence}"`,
          partOfSpeech: 'term',
          tags: ['academic-vocabulary'],
        });
      }
    }

    return {
      originalText: text,
      translatedText: `[Translation to ${targetLanguage}]: ${text}`,
      sourceLanguage: 'ru',
      targetLanguage,
      terms: extractedTerms.slice(0, 5),
    };
  }
}

export const llmService = new LLMService();
