/**
 * Universal Russian audio pronunciation engine for RuScholar TMA.
 * Multi-tiered strategy:
 * 1. Native HTML5 Audio playback via backend /api/tts endpoint (Google Studio TTS stream)
 * 2. Direct client-side Google TTS audio element fallback
 * 3. Browser SpeechSynthesis API fallback with ru-RU voice
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://ruscholar-tma.onrender.com/api';

let activeAudio: HTMLAudioElement | null = null;

export const speakRussian = async (text: string): Promise<void> => {
  const sanitized = text.trim();
  if (!sanitized) return;

  // Stop any currently playing audio
  if (activeAudio) {
    try {
      activeAudio.pause();
      activeAudio.currentTime = 0;
    } catch {
      // Ignore pause errors
    }
    activeAudio = null;
  }

  // Tier 1 & 2: HTML5 Audio via Google TTS (crystal-clear native human pronunciation)
  const candidateUrls = [
    `${API_BASE_URL}/tts?text=${encodeURIComponent(sanitized)}`,
    `https://translate.google.com/translate_tts?ie=UTF-8&tl=ru&client=tw-ob&q=${encodeURIComponent(sanitized)}`,
  ];

  for (const url of candidateUrls) {
    try {
      await new Promise<void>((resolve, reject) => {
        const audio = new Audio(url);
        activeAudio = audio;

        audio.onended = () => {
          activeAudio = null;
          resolve();
        };

        audio.onerror = () => {
          activeAudio = null;
          reject(new Error('Audio load error'));
        };

        // Timeout fallback after 6 seconds in case playback hangs
        const timeoutId = setTimeout(() => {
          resolve();
        }, 6000);

        audio.play().then(() => {
          // Playback started successfully
        }).catch((err) => {
          clearTimeout(timeoutId);
          reject(err);
        });
      });

      // If playback completed successfully, return
      return;
    } catch (audioErr) {
      console.warn('[Speech] Audio stream failed, trying next fallback:', audioErr);
    }
  }

  // Tier 3: Browser SpeechSynthesis API fallback
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
      window.speechSynthesis.resume(); // Fixes Chromium audio context pause bug

      const utterance = new SpeechSynthesisUtterance(sanitized);
      utterance.lang = 'ru-RU';
      utterance.rate = 0.88;
      utterance.pitch = 1.0;

      const voices = window.speechSynthesis.getVoices();
      const ruVoice = voices.find(
        (v) => v.lang.startsWith('ru') || v.name.toLowerCase().includes('russian')
      );
      if (ruVoice) {
        utterance.voice = ruVoice;
      }

      window.speechSynthesis.speak(utterance);
    } catch (synthErr) {
      console.error('[Speech] SpeechSynthesis fallback failed:', synthErr);
    }
  }
};
