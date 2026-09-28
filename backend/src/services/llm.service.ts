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

    // Robust heuristic / dictionary / online translation fallback
    return await this.fallbackAcademicExtractor(trimmedText, targetLanguage);
  }

  /**
   * High-accuracy translation engine with multi-tiered public fallbacks:
   * 1. Google Chrome Dictionary Client (reliable, avoids 429 rate-limiting)
   * 2. Google Translate public GTX API
   * 3. MyMemory Translation API with authorized application header
   */
  public async translateText(
    text: string,
    targetLanguage: string = 'en'
  ): Promise<string> {
    const trimmed = text.trim();
    if (!trimmed) return '';

    const browserHeaders = {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      Accept: 'application/json, text/plain, */*',
      'Accept-Language': 'en-US,en;q=0.9,ru;q=0.8',
    };

    // Tier 1: Google Translate Chrome Extension Client (avoids standard web 429 blocks)
    try {
      const url = `https://translate.googleapis.com/translate_a/single?client=dict-chrome-ex&sl=auto&tl=${encodeURIComponent(
        targetLanguage
      )}&dt=t&q=${encodeURIComponent(trimmed)}`;
      const response = await axios.get(url, { headers: browserHeaders, timeout: 6000 });
      if (Array.isArray(response.data) && Array.isArray(response.data[0])) {
        const fullTranslation = response.data[0]
          .map((item: [string, ...unknown[]]) => item[0])
          .join('')
          .trim();
        if (fullTranslation && fullTranslation.toLowerCase() !== trimmed.toLowerCase()) {
          return fullTranslation;
        }
      }
    } catch (err) {
      console.warn('[LLM Service] Google dict-chrome-ex failed:', (err as Error).message);
    }

    // Tier 2: Google Translate GTX API
    try {
      const gtxUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${encodeURIComponent(
        targetLanguage
      )}&dt=t&q=${encodeURIComponent(trimmed)}`;
      const response = await axios.get(gtxUrl, { headers: browserHeaders, timeout: 6000 });
      if (Array.isArray(response.data) && Array.isArray(response.data[0])) {
        const fullTranslation = response.data[0]
          .map((item: [string, ...unknown[]]) => item[0])
          .join('')
          .trim();
        if (fullTranslation && fullTranslation.toLowerCase() !== trimmed.toLowerCase()) {
          return fullTranslation;
        }
      }
    } catch (err) {
      console.warn('[LLM Service] Google GTX failed:', (err as Error).message);
    }

    // Tier 3: MyMemory Translation API
    try {
      const myMemoryUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
        trimmed
      )}&langpair=ru|${encodeURIComponent(targetLanguage)}&de=ruscholar.tma@gmail.com`;
      const response = await axios.get(myMemoryUrl, { headers: browserHeaders, timeout: 6000 });
      const translated = response.data?.responseData?.translatedText;
      if (
        typeof translated === 'string' &&
        translated.trim().length > 0 &&
        translated.trim().toLowerCase() !== trimmed.toLowerCase()
      ) {
        return translated.trim();
      }
    } catch (err) {
      console.warn('[LLM Service] MyMemory API error:', (err as Error).message);
    }

    return trimmed;
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
   * Resilient fallback academic parser. Translates text dynamically, maps academic keywords,
   * and creates flashcards with genuine translations even without external LLM credentials.
   */
  private async fallbackAcademicExtractor(
    text: string,
    targetLanguage: string
  ): Promise<AcademicAnalysisResult> {
    // 1. Academic dictionary of prevalent Russian university/STEM terms & common conversational phrases
    const academicDictionary: Record<
      string,
      { en: string; pos: string; tags: string[] }
    > = {
      'здравствуйте': { en: 'Hello / Greetings', pos: 'greeting', tags: ['conversation'] },
      'привет': { en: 'Hello / Hi', pos: 'greeting', tags: ['conversation'] },
      'добрый день': { en: 'Good day / Good afternoon', pos: 'greeting', tags: ['conversation'] },
      'доброе утро': { en: 'Good morning', pos: 'greeting', tags: ['conversation'] },
      'добрый вечер': { en: 'Good evening', pos: 'greeting', tags: ['conversation'] },
      'пока': { en: 'Bye / See you', pos: 'interjection', tags: ['conversation'] },
      'до свидания': { en: 'Goodbye / See you later', pos: 'phrase', tags: ['conversation'] },
      'спасибо': { en: 'Thank you', pos: 'phrase', tags: ['conversation'] },
      'пожалуйста': { en: "Please / You're welcome", pos: 'phrase', tags: ['conversation'] },

      'курсовая работа': { en: 'coursework / term project', pos: 'noun phrase', tags: ['academics', 'projects'] },
      'дипломная работа': { en: 'graduation thesis', pos: 'noun phrase', tags: ['thesis', 'graduation'] },
      'научный руководитель': { en: 'academic advisor / supervisor', pos: 'noun phrase', tags: ['administration', 'research'] },
      'лабораторная работа': { en: 'laboratory assignment', pos: 'noun phrase', tags: ['lab', 'practical'] },
      'отчет по лабораторной работе': { en: 'laboratory report', pos: 'noun phrase', tags: ['lab', 'report'] },
      'отчет': { en: 'report / summary', pos: 'noun', tags: ['study', 'assignment'] },
      'защита': { en: 'defense (thesis / project)', pos: 'noun', tags: ['thesis', 'exams'] },
      'аудитория': { en: 'lecture hall / classroom / room', pos: 'noun', tags: ['university', 'campus'] },
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
      'стипендия': { en: 'scholarship / academic stipend', pos: 'noun', tags: ['finance', 'university'] },
      'пересдача': { en: 'retake / re-examination', pos: 'noun', tags: ['exams', 'grading'] },
      'староста': { en: 'class representative / group leader', pos: 'noun', tags: ['administration', 'students'] },
      'университет': { en: 'university', pos: 'noun', tags: ['academics'] },
      'факультет': { en: 'faculty / department', pos: 'noun', tags: ['academics'] },
    };

    // 2. Perform translation of the full text
    let translatedText = await this.translateText(text, targetLanguage);

    const lowerCleanedText = text.trim().toLowerCase().replace(/[.,!?;:«»"()]/g, '');

    // 3. Fallback guard: If translatedText is identical to original text or still Russian, check dictionary
    if (
      translatedText.trim().toLowerCase() === text.trim().toLowerCase() ||
      /[а-яёА-ЯЁ]/.test(translatedText)
    ) {
      if (academicDictionary[lowerCleanedText]) {
        translatedText = academicDictionary[lowerCleanedText].en;
      }
    }

    const sentences = text
      .split(/(?<=[.!?])\s+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const extractedTerms: ExtractedTerm[] = [];
    const lowerText = text.toLowerCase();

    // Check predefined academic terms (prioritize longer phrases first)
    const sortedKeys = Object.keys(academicDictionary).sort((a, b) => b.length - a.length);

    for (const term of sortedKeys) {
      if (lowerText.includes(term)) {
        const meta = academicDictionary[term];
        if (!meta) continue;

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

        // Limit to 5 terms
        if (extractedTerms.length >= 5) break;
      }
    }

    // 4. If no predefined dictionary terms matched, extract words and dynamically translate them
    if (extractedTerms.length === 0) {
      // Split words (both Cyrillic and Latin)
      const words = text
        .split(/[\s,.;:!?()«»"]+/)
        .map((w) => w.trim())
        .filter((w) => w.length >= 3);

      const uniqueWords = Array.from(new Set(words)).slice(0, 3);
      for (const word of uniqueWords) {
        const sentence = sentences.find((s) => s.includes(word)) || text;
        const translatedWord = await this.translateText(word, targetLanguage);
        const translatedSentence = await this.translateText(sentence, targetLanguage);

        extractedTerms.push({
          originalTerm: word.toLowerCase(),
          translatedTerm: translatedWord || word,
          contextSentenceRu: sentence,
          contextSentenceEn: translatedSentence,
          partOfSpeech: 'term',
          tags: ['academic-vocabulary'],
        });
      }
    }

    // Guard: If text is short and translatedText still equals original, use first extracted term translation
    if (
      (translatedText.trim().toLowerCase() === text.trim().toLowerCase() || /[а-яёА-ЯЁ]/.test(translatedText)) &&
      extractedTerms[0]
    ) {
      translatedText = extractedTerms[0].translatedTerm;
    }

    return {
      originalText: text,
      translatedText,
      sourceLanguage: 'ru',
      targetLanguage,
      terms: extractedTerms.slice(0, 5),
    };
  }
}

export const llmService = new LLMService();
