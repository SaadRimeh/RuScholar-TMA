# RuScholar TMA — Backend Service

[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Express.js](https://img.shields.io/badge/Express.js-5.x-lightgrey?logo=express)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248?logo=mongodb)](https://mongoosejs.com/)
[![Docker](https://img.shields.io/badge/Docker-Node%2022%20Alpine-2496ED?logo=docker)](https://www.docker.com/)

> **High-Performance Node.js & TypeScript Backend for RuScholar TMA.**  
> Responsible for Telegram Bot Webhook ingestion, YandexGPT academic term extraction, SuperMemo SM-2 spaced repetition scheduling, and HMAC-SHA-256 authenticated REST APIs for the Telegram Mini App.

---

## 🏛 Layered Clean Architecture

The backend strictly adheres to Clean Layered Architecture to guarantee domain decoupling, modular testability, and enterprise maintainability:

```
backend/
├── src/
│   ├── config/
│   │   ├── env.ts                 # Strongly typed, validated environment configuration
│   │   └── database.ts            # Mongoose connection manager with lifecycle events
│   ├── types/
│   │   ├── express.d.ts           # Type augmentation for Express Request (req.telegramUser, req.userDoc)
│   │   ├── telegram.types.ts      # Webhook payloads and Mini App user data interfaces
│   │   ├── user.types.ts          # User document contracts
│   │   ├── message.types.ts       # Message document contracts
│   │   ├── flashcard.types.ts     # Flashcard entity & SM-2 grade types
│   │   └── academic.types.ts      # LLM academic term extraction interfaces
│   ├── models/
│   │   ├── User.model.ts          # Mongoose schema with unique telegramId index
│   │   ├── Message.model.ts       # Mongoose schema with compound chronological indexes
│   │   └── Flashcard.model.ts     # Mongoose schema with SM-2 metrics & compound query indexes
│   ├── middlewares/
│   │   ├── validateInitData.ts    # Telegram initData HMAC-SHA-256 cryptographic guard
│   │   ├── errorHandler.ts        # Centralized error handler
│   │   └── notFound.ts            # 404 handler
│   ├── controllers/
│   │   ├── webhook.controller.ts  # Webhook receiver with secret token check & async dispatch
│   │   └── flashcard.controller.ts# Mini App REST controller with IDOR protection
│   ├── routes/
│   │   ├── index.ts               # Root API router (/api)
│   │   ├── webhook.routes.ts      # Webhook router (/api/webhook)
│   │   └── flashcard.routes.ts    # Protected flashcard router (/api/flashcards)
│   ├── services/
│   │   ├── llm.service.ts         # Yandex Foundation Models (YandexGPT) & Fallback parser
│   │   ├── telegram.service.ts    # Telegram Bot API client (HTML formatting, typing, WebApp button)
│   │   ├── bot.service.ts         # Ingestion workflow orchestrator
│   │   └── srs.service.ts         # Pure SuperMemo SM-2 algorithm calculations
│   ├── app.ts                     # Express application factory
│   └── server.ts                  # Server bootstrap & graceful shutdown lifecycle
├── tests/
│   ├── hmac.test.ts               # HMAC-SHA-256 security tests (replay, tampering, spoofing)
│   ├── srs.test.ts                # SM-2 calculation and rating tests
│   ├── llm.test.ts                # Academic NLP extraction tests
│   └── runAll.ts                  # Cross-platform test suite runner
├── Dockerfile                     # Multi-stage production container
├── .dockerignore                  # Docker ignore rules
├── .env.example                   # Environment variable template
├── package.json                   # Dependencies and npm scripts
└── tsconfig.json                  # Strict TypeScript configuration
```

---

## 📡 RESTful API Reference

All `/api/flashcards/*` endpoints require Telegram authentication via the header:  
`Authorization: tma <raw_initData>` or `x-telegram-init-data: <raw_initData>`.

| Method | Endpoint | Description | Auth Required | Parameters / Body |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Service health & MongoDB status | No | None |
| `POST` | `/api/webhook/telegram` | Ingests Telegram Bot Webhook updates | Secret Header | Body: `TelegramUpdate` |
| `GET` | `/api/flashcards/session` | Verifies TMA credentials and returns user profile | **Yes (HMAC)** | None |
| `GET` | `/api/flashcards/due` | Fetches cards due for review (`nextReviewDate <= now`) | **Yes (HMAC)** | Query: `limit` (int), `tag` (string) |
| `POST` | `/api/flashcards/:id/review`| Submits a review grade and recalculates SM-2 interval | **Yes (HMAC)** | Body: `{ rating: 'again'\|'hard'\|'good'\|'easy' }` or `{ grade: 0-5 }` |
| `GET` | `/api/flashcards/stats` | Aggregated deck analytics (due, mastered, total) | **Yes (HMAC)** | None |
| `GET` | `/api/flashcards` | Paginated deck browser with search and tag filters | **Yes (HMAC)** | Query: `page`, `limit`, `search`, `tag` |
| `DELETE`| `/api/flashcards/:id` | Deletes a flashcard belonging to the student | **Yes (HMAC)** | URL Param: `id` |

---

## 🔐 Security Architecture

### 1. Telegram `initData` HMAC-SHA-256 Verification
The middleware [`validateInitData.ts`](file:///c:/Users/Windows.11/Desktop/ProgrammingJob/RuScholar-TMA/backend/src/middlewares/validateInitData.ts) implements Telegram's cryptographic validation standard:
1. Strips `hash` from query string and sorts remaining `key=value` pairs alphabetically.
2. Derives secret key via $\text{HMAC-SHA-256}("WebAppData", \text{BOT\_TOKEN})$.
3. Calculates expected hash over `data_check_string` and performs timing-safe buffer comparison with `crypto.timingSafeEqual`.
4. Rejects expired sessions ($> 24\text{ hours}$) to eliminate replay attacks.
5. Upserts and attaches the authenticated user record to `req.userDoc`.

### 2. IDOR (Insecure Direct Object Reference) Prevention
All flashcard mutations verify ownership via `{ _id: cardId, userId: req.userDoc._id }`, preventing unauthorized cross-user modifications.

---

## 🗄 Database Design & Indexing

The Mongoose schemas employ compound indexing optimized for high-throughput reads:

| Collection | Schema | Compound Index | Usage / Query Optimization |
| :--- | :--- | :--- | :--- |
| **`users`** | `User.model.ts` | `{ telegramId: 1 }` (unique) | $O(1)$ user identification |
| **`messages`** | `Message.model.ts` | `{ userId: 1, createdAt: -1 }` | Fast message timeline history |
| **`messages`** | `Message.model.ts` | `{ userId: 1, telegramMessageId: 1 }` | Prevents duplicate update processing |
| **`flashcards`** | `Flashcard.model.ts` | `{ userId: 1, nextReviewDate: 1 }` | Optimized for `find({ userId, nextReviewDate: { $lte: now } }).sort({ nextReviewDate: 1 })` |
| **`flashcards`** | `Flashcard.model.ts` | `{ userId: 1, originalTerm: 1 }` | Prevents duplicate terms per user |

---

## 🧮 SuperMemo SM-2 Implementation

Implemented in [`srs.service.ts`](file:///c:/Users/Windows.11/Desktop/ProgrammingJob/RuScholar-TMA/backend/src/services/srs.service.ts):

* **Ease Factor Adjustment**:
  $$EF' = \max\left(1.3, \; EF + \left(0.1 - (5 - q) \times (0.08 + (5 - q) \times 0.02)\right)\right)$$
* **Repetition & Interval**:
  - If $q < 3$: $\text{repetition}' = 0, \quad \text{interval}' = 1\text{ day}$.
  - If $q \ge 3$:
    - $\text{repetition} == 0 \implies \text{interval}' = 1\text{ day}$.
    - $\text{repetition} == 1 \implies \text{interval}' = 6\text{ days}$.
    - $\text{repetition} \ge 2 \implies \text{interval}' = \text{round}(\text{interval} \times EF')$.
    - $\text{repetition}' = \text{repetition} + 1$.

---

## ⚙️ Environment Variables

Copy `.env.example` to `.env`:

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/ruscholar
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_WEBHOOK_SECRET=your_webhook_secret_here
TELEGRAM_WEBHOOK_URL=https://your-domain.com/api/webhook/telegram
TELEGRAM_MINI_APP_URL=http://localhost:5173
CLIENT_ORIGIN=http://localhost:5173
YANDEX_API_KEY=your_yandex_api_key_optional
YANDEX_FOLDER_ID=your_yandex_folder_id_optional
```

---

## 🛠 Available Scripts

```bash
# Install dependencies
npm install

# Run automated test suites (HMAC, SM-2, LLM)
npm test

# Run TypeScript typecheck without emitting code
npm run typecheck

# Build production bundle in dist/
npm run build

# Start production server
npm start

# Start development server with hot-reload
npm run dev
```

---

## 📬 Contact

* **Author**: Saad Rimeh
* **Email**: [Saad.rimeh.01@gmail.com](mailto:Saad.rimeh.01@gmail.com)
* **Master's in Software Engineering Applicant** (Open Doors Russian Scholarship Project)
