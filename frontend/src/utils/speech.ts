/**
 * Client-side Russian text-to-speech engine using the browser SpeechSynthesis API.
 * Seamlessly supported across Telegram iOS, Android, and Desktop webviews.
 */
export const speakRussian = (text: string): void => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    console.warn('[Speech] SpeechSynthesis API not supported in this environment');
    return;
  }

  try {
    // Cancel any previous utterances
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ru-RU';
    utterance.rate = 0.88; // Slightly slower, perfect for academic learner comprehension
    utterance.pitch = 1.0;

    // Pick a Russian voice if available in the system
    const voices = window.speechSynthesis.getVoices();
    const ruVoice = voices.find(
      (v) => v.lang.startsWith('ru') || v.name.toLowerCase().includes('russian')
    );
    if (ruVoice) {
      utterance.voice = ruVoice;
    }

    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.warn('[Speech] Failed to pronounce Russian term:', err);
  }
};
