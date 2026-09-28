# RuScholar TMA (Academic Translate & Learn)

> **Enterprise-Grade Telegram Mini App & Bot for International Students in Russian Universities**  
> Developed for the Master's in Software Engineering Portfolio (Open Doors Russian Scholarship Project).

---

## 📌 Executive Summary

**RuScholar TMA** is an educational and linguistic assistance platform engineered to eliminate language barriers for international university students studying in the Russian Federation. By bridging Telegram's real-time messaging ecosystem with an integrated Telegram Mini App (TMA), the system facilitates seamless academic comprehension:

1. **Academic Ingestion via Telegram Bot**: Students forward Russian lecture announcements, research papers, assignment prompts, and academic notices to the bot.
2. **Linguistic Decomposition & Term Extraction**: Academic messages are translated while extracting critical discipline-specific terminology and context sentences using Yandex / LLM services.
3. **Automated SRS Generation**: Extracted academic terms are transformed into personalized flashcards stored in MongoDB with SuperMemo SM-2 spaced repetition metrics.
4. **Interactive Mini App Review**: Students review due flashcards inside the React-based Telegram Mini App directly within Telegram, optimizing long-term retention.

---

## 🏛 System Architecture & Folder Hierarchy

The repository adopts a clean, decoupled monorepo architecture adhering to Domain-Driven and Layered Clean Architecture patterns:

```
RuScholar-TMA/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── env.ts                 # Strongly-typed environment variables & validation
│   │   │   └── database.ts            # MongoDB connection manager with lifecycle events
│   │   ├── controllers/
│   │   │   └── webhook.controller.ts  # Webhook ingestion & secret token verification
│   │   ├── middlewares/
│   │   │   ├── validateInitData.ts    # Telegram initData HMAC-SHA-256 security middleware
│   │   │   ├── errorHandler.ts        # Centralized enterprise error handler
│   │   │   └── notFound.ts            # 404 route handler
│   │   ├── models/
│   │   │   ├── User.model.ts          # Mongoose User model with unique Telegram ID index
│   │   │   ├── Message.model.ts       # Mongoose Message model with compound query indexes
│   │   │   └── Flashcard.model.ts     # Mongoose Flashcard model with SM-2 SRS metrics & indexes
│   │   ├── routes/
│   │   │   ├── index.ts               # Root API router (/api)
│   │   │   ├── webhook.routes.ts      # Webhook ingestion routes (/api/webhook)
│   │   │   └── flashcard.routes.ts    # Mini App authenticated routes (/api/flashcards)
│   │   ├── types/
│   │   │   ├── express.d.ts           # Type augmentation for Express Request (req.telegramUser)
│   │   │   ├── telegram.types.ts      # Telegram Bot & Mini App domain interfaces
│   │   │   ├── user.types.ts          # User document interfaces
│   │   │   ├── message.types.ts       # Message document interfaces
│   │   │   └── flashcard.types.ts     # Flashcard and SRS grade types
│   │   ├── app.ts                     # Express app factory (CORS, parser, middleware pipeline)
│   │   └── server.ts                  # Server bootstrap & graceful shutdown lifecycle
│   ├── tests/
│   │   └── hmac.test.ts               # Unit & security test suite for HMAC verification
│   ├── .env.example                   # Environment configuration template
│   ├── package.json                   # Dependencies & npm scripts
│   └── tsconfig.json                  # Strict TypeScript configuration
├── frontend/                          # React + TypeScript Telegram Mini App (Vite)
├── .gitignore                         # Root Git ignore rules
└── README.md                          # Project documentation
```

---

## 🔐 Security Architecture: Telegram HMAC-SHA-256 Validation

The backend enforces Telegram's official cryptographic authentication specification to protect all Mini App API routes against spoofing, forgery, and replay attacks:

1. **Signature Computation**:
   $$\text{secret\_key} = \text{HMAC-SHA-256}(\text{"WebAppData"}, \text{BOT\_TOKEN})$$
   $$\text{expected\_hash} = \text{HMAC-SHA-256}(\text{secret\_key}, \text{data\_check\_string})$$
2. **Replay Attack Defense**: Validates `auth_date` against a 24-hour expiration window.
3. **Timing-Safe Comparison**: Utilizes `crypto.timingSafeEqual` with strict 64-character hexadecimal parsing to prevent side-channel timing attacks.
4. **Automated User Synchronization**: Upserts and attaches the authenticated `req.telegramUser` and `req.userDoc` to the Express pipeline.

---

## 🗄 Database Design & Indexing

The MongoDB database layer is optimized for high-throughput reads and low-latency spaced repetition scheduling:

| Model | Key Fields | Applied Indexes | Purpose |
| :--- | :--- | :--- | :--- |
| **`User`** | `telegramId`, `username`, `firstName`, `targetLanguage` | `{ telegramId: 1 }` (unique)<br>`{ username: 1 }` (sparse) | $O(1)$ user identification and authentication lookup |
| **`Message`** | `userId`, `telegramMessageId`, `originalText`, `translatedText` | `{ userId: 1, createdAt: -1 }`<br>`{ userId: 1, telegramMessageId: 1 }` | Chronological history & idempotency |
| **`Flashcard`** | `userId`, `originalTerm`, `translatedTerm`, `interval`, `repetition`, `easeFactor`, `nextReviewDate` | `{ userId: 1, nextReviewDate: 1 }`<br>`{ userId: 1, originalTerm: 1 }`<br>`{ tags: 1 }` | Ultra-fast retrieval of due cards (`nextReviewDate <= now`), deduplication |

---

## 🚀 Getting Started (Backend)

### Prerequisites
* Node.js $\ge$ 20.x
* MongoDB instance (local or Atlas)

### Installation & Execution
```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Run cryptographic test suite
npm test

# Compile TypeScript
npm run build

# Start in development mode (with hot-reload)
npm run dev
```

---

## 🗺 Roadmap

- [x] **Task 1: Backend Initialization & Architecture** *(Completed)*
  - Modular layered directory hierarchy
  - Mongoose models (`User`, `Message`, `Flashcard` with SM-2 SRS metrics and compound indexes)
  - Telegram Webhook endpoint with secret token verification
  - Enterprise HMAC-SHA-256 validation middleware with timing-safe comparison
- [x] **Task 2: Bot Logic & LLM Integration** *(Completed)*
  - Telegram Bot service layer (`telegram.service.ts`) with HTML formatting & Mini App WebApp button
  - Academic translation & LLM terminology extraction service (`llm.service.ts`) with YandexGPT API & resilient fallback
  - Orchestration pipeline (`bot.service.ts`) automating translation, terms extraction, message persistence, and default SM-2 flashcard creation in MongoDB
- [x] **Task 3: Backend API for the Mini App** *(Completed)*
  - SuperMemo SM-2 Spaced Repetition engine (`srs.service.ts`) with ease factor, repetition, and interval calculation
  - Due flashcard query endpoint (`GET /api/flashcards/due`) utilizing compound index `{ userId: 1, nextReviewDate: 1 }`
  - Flashcard review submission endpoint (`POST /api/flashcards/:id/review`) with IDOR protection
  - Comprehensive deck statistics (`GET /api/flashcards/stats`) and paginated search (`GET /api/flashcards`)
- [x] **Task 4: Frontend Boilerplate & Telegram SDK** *(Completed)*
  - Vite React + TypeScript boilerplate with strict module typing
  - Telegram WebApp SDK initialization (`@twa-dev/sdk`), viewport expansion, and haptic feedback integration
  - Axios HTTP client with request/response interceptors injecting `Authorization: tma <initData>`
  - Responsive Telegram design system (`index.css`) with glassmorphism and theme synchronization
- [x] **Task 5: Frontend SRS Interface & State Management** *(Completed)*
  - Interactive 3D flip card component (`FlashcardReview.tsx`) with Russian term, translation, and context
  - SuperMemo SM-2 rating interaction buttons ("Again", "Hard", "Good", "Easy") with projected interval calculations
  - Session completion screen (`ReviewComplete.tsx`) with celebration animations and haptic feedback
  - Full vocabulary dictionary browser (`AllCardsView.tsx`) with live search and tag filtering
  - State management integrating live deck statistics, session queues, and optimistic updates
- [ ] **Task 6: DevOps & Deployment Prep**