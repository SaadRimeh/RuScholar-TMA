# RuScholar TMA — Frontend Mini App

[![React](https://img.shields.io/badge/React-19.x-61dafb?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8.x-646CFF?logo=vite)](https://vite.dev/)
[![Telegram Web App](https://img.shields.io/badge/Telegram-@twa--dev/sdk-26A5E4?logo=telegram)](https://core.telegram.org/bots/webapps)
[![Nginx](https://img.shields.io/badge/Nginx-Alpine%201.27-009639?logo=nginx)](https://nginx.org/)

> **Mobile-First React Telegram Mini App for RuScholar.**  
> Delivers an interactive 3D Spaced Repetition (SM-2) flashcard learning interface, authenticated securely via Telegram's cryptographic `initData` protocol.

---

## 🏛 Frontend Architecture

The frontend follows a modular, feature-oriented structure with clear separation between state, UI components, API layer, and Telegram SDK hooks:

```
frontend/
├── src/
│   ├── api/
│   │   ├── client.ts             # Axios client with request/response interceptors injecting Telegram initData
│   │   └── flashcards.api.ts     # Strongly typed API client methods (due cards, reviews, deck stats, session)
│   ├── components/
│   │   ├── FlashcardReview.tsx   # Interactive 3D flip card with SM-2 rating buttons & projected intervals
│   │   ├── ReviewComplete.tsx    # Celebratory session completion screen with haptic feedback
│   │   ├── AllCardsView.tsx      # Searchable vocabulary dictionary with subject tag filtering
│   │   ├── Navbar.tsx            # Sticky header displaying student avatar, username, and live Due badge
│   │   ├── Tabs.tsx              # Segmented navigation between Dashboard, Review, and Dictionary
│   │   └── LoadingSpinner.tsx    # Hardware-accelerated loading spinner
│   ├── context/
│   │   └── TelegramContext.tsx   # React context initializing @twa-dev/sdk, theme synchronization, and haptics
│   ├── hooks/
│   │   └── useTelegram.ts        # Custom hook for ergonomic access to Telegram WebApp context
│   ├── types/
│   │   ├── flashcard.types.ts    # IFlashcard, SRSRating, SRSGrade, and DeckStats domain interfaces
│   │   ├── telegram.types.ts     # TMA User, theme parameters, and context contracts
│   │   └── window.d.ts           # Ambient Window.Telegram TypeScript declaration
│   ├── App.tsx                   # Main application orchestrator managing view states and review flow
│   ├── index.css                 # Design tokens, glassmorphism panels, and 3D card flip keyframes
│   └── main.tsx                  # Application bootstrap wrapped with TelegramProvider
├── nginx.conf                     # Production Nginx configuration with Gzip and Telegram iframe CSP
├── Dockerfile                     # Multi-stage production container
├── package.json                   # Dependencies and npm scripts
├── tsconfig.json                  # Strict TypeScript configuration
└── vite.config.ts                 # Vite config with /api reverse proxy
```

---

## 📱 Telegram WebApp SDK Integration

Implemented in [`TelegramContext.tsx`](file:///c:/Users/Windows.11/Desktop/ProgrammingJob/RuScholar-TMA/frontend/src/context/TelegramContext.tsx):

1. **Lifecycle Handshake**: Calls `WebApp.ready()` on mount to notify Telegram that the webview is ready for presentation.
2. **Viewport Expansion**: Invokes `WebApp.expand()` to maximize vertical screen space inside Telegram on mobile clients.
3. **Dynamic Theme Adaptation**: Reads `WebApp.themeParams` and `WebApp.colorScheme` (`dark` / `light`), binding them dynamically to CSS variables (`--tg-theme-bg-color`, `--tg-theme-text-color`, `--tg-theme-button-color`).
4. **Haptic Feedback**:
   - `triggerHaptic('light' | 'medium' | 'heavy')`: Sensory feedback on card flips and rating taps.
   - `triggerNotificationFeedback('success' | 'error')`: Sensory feedback on review session completion.
5. **Standalone Browser Resilience**: When tested in a regular browser outside Telegram, provides an automatic mock development session so engineers can develop without running Telegram.

---

## 🔐 Cryptographic Authentication via Axios Interceptors

All outbound API calls automatically include the student's cryptographic credentials in [`client.ts`](file:///c:/Users/Windows.11/Desktop/ProgrammingJob/RuScholar-TMA/frontend/src/api/client.ts):

```typescript
apiClient.interceptors.request.use((config) => {
  const initData = WebApp?.initData || window.Telegram?.WebApp?.initData;
  if (initData) {
    config.headers.set('Authorization', `tma ${initData}`);
    config.headers.set('x-telegram-init-data', initData);
  }
  return config;
});
```

---

## 🎴 3D Flashcard Review Interface

* **Hardware-Accelerated 3D Flip**: Implemented with CSS 3D transforms (`perspective: 1200px`, `transform-style: preserve-3d`).
* **Front Face**: Displays Russian academic term, grammatical category (`noun`, `verb`, `phrase`), domain tags, and contextual excerpt from professor notices.
* **Back Face**: Displays English translation, translated context sentence, and current SRS retention status.
* **Live Interval Projections**: Action buttons dynamically compute future intervals:
  - 🔴 **Again**: Resets to `1d`
  - 🟠 **Hard**: Conservative progression
  - 🔵 **Good**: Standard SM-2 interval step
  - 🟢 **Easy**: Accelerated interval with ease factor bonus

---

## 🛠 Available Scripts

```bash
# Install dependencies
npm install

# Start Vite development server (with reverse proxy to backend)
npm run dev

# Run TypeScript compilation and build production distribution in dist/
npm run build

# Preview production build locally
npm run preview
```

---

## 🐳 Production Containerization

The frontend builds into a minimal production Nginx image:

```bash
docker build -t ruscholar-frontend .
docker run -p 8080:80 ruscholar-frontend
```

* **Gzip Compression**: Pre-compresses text, CSS, JavaScript, and SVG assets.
* **Iframe Compatibility**: Embeddable in Telegram Web via `Content-Security-Policy: frame-ancestors 'self' https://web.telegram.org https://*.telegram.org https://*.t.me;`.
* **SPA Fallback**: Fallbacks unmatched routes to `/index.html`.

---

## 📬 Contact

* **Author**: Saad Rimeh
* **Email**: [Saad.rimeh.01@gmail.com](mailto:Saad.rimeh.01@gmail.com)
* **Master's in Software Engineering Applicant** (Open Doors Russian Scholarship Project)
