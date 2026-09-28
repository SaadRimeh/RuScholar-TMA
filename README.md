<div align="center">
  <img src="assets/logo.svg" alt="RuScholar TMA Logo" width="160" height="160" />
  <h1>RuScholar TMA</h1>
  <p><b>Academic Translate &amp; Learn for International Students in Russia</b></p>
  <p><i>Enterprise-grade Telegram Bot &amp; Integrated Mini App (TMA)</i></p>

  <p>
    <a href="#-the-real-world-academic-problem-solved">Problem Solved</a> •
    <a href="#-system-architecture">Architecture</a> •
    <a href="#-end-to-end-sequence-workflows">Workflows</a> •
    <a href="#-cryptographic-security--telegram-verification">Security</a> •
    <a href="#-quick-start--installation">Quick Start</a> •
    <a href="#-contact--author-information">Contact</a>
  </p>

  [![TypeScript](https://img.shields.io/badge/TypeScript-5.x%20%7C%206.x-blue?logo=typescript)](https://www.typescriptlang.org/)
  [![Node.js](https://img.shields.io/badge/Node.js-22.x-green?logo=node.js)](https://nodejs.org/)
  [![Express.js](https://img.shields.io/badge/Express.js-5.x-lightgrey?logo=express)](https://expressjs.com/)
  [![React](https://img.shields.io/badge/React-19.x-61dafb?logo=react)](https://react.dev/)
  [![MongoDB](https://img.shields.io/badge/MongoDB-7.0-47A248?logo=mongodb)](https://www.mongodb.com/)
  [![Telegram](https://img.shields.io/badge/Telegram-Mini%20App%20SDK-26A5E4?logo=telegram)](https://core.telegram.org/bots/webapps)
  [![Docker](https://img.shields.io/badge/Docker-Multi--Stage-2496ED?logo=docker)](https://www.docker.com/)
  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
</div>

> **Master's in Software Engineering Portfolio Project** (**Open Doors Russian Scholarship Project**).  
> Designed to empower international university students across the Russian Federation to overcome academic language barriers with AI translation and Spaced Repetition (SM-2).

---

## 🎯 The Real-World Academic Problem Solved

Every year, tens of thousands of international students arrive in the Russian Federation to pursue advanced degrees in Software Engineering, Computer Science, Mathematics, Physics, and Medicine. Despite completing preparatory language faculties (подфак), international students encounter severe linguistic and cognitive friction upon entering actual university degree programs:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        THE INTERNATIONAL STUDENT CHALLENGE IN RUSSIA                   │
├────────────────────────────────┬───────────────────────────────┬───────────────────────┤
│ 1. Heavy Academic Telegram Use │ 2. Technical Context Collapse  │ 3. The Retention Gap  │
│ Russian universities           │ Standard translation tools    │ Copy-pasting into     │
│ (деканат, кафедры, староста)   │ fail on university-specific   │ translators provides  │
│ broadcast homework, thesis     │ terminology (e.g. "зачёт",    │ momentary clarity,    │
│ deadlines, and lab notes       │ "курсовая работа",            │ but students quickly  │
│ exclusively in Telegram.       │ "дифференциальное уравнение").│ forget key terms.     │
└────────────────────────────────┴───────────────────────────────┴───────────────────────┘
```

### How RuScholar Solves This

1. **Zero Context Switching**: Students stay inside Telegram. When an intimidating Russian announcement arrives, they simply **forward the message** to `@RuScholarBot`.
2. **Academic Terminology Extraction**: The bot translates the text and uses an Academic NLP / YandexGPT service to extract technical terms with bidirectional Russian/English contextual sentences.
3. **Automated SRS Flashcard Generation**: The extracted terms are instantly saved to MongoDB with default **SuperMemo SM-2 Spaced Repetition System** metrics.
4. **Telegram Mini App (TMA)**: The student taps one button to launch the embedded React Mini App, reviewing flashcards with scientific intervals ("Again", "Hard", "Good", "Easy") right inside Telegram.

---

## 🏛 System Architecture

The project is structured as a clean monorepo separating the Express/TypeScript API backend from the Vite/React Mini App frontend while sharing domain models and security contracts:

```mermaid
graph TD
    User([International Student]) -->|Forwards Russian Academic Notice| TG[Telegram Messenger]
    TG -->|Webhook POST /api/webhook/telegram| BE[RuScholar Express Backend]
    
    subgraph "Backend Services"
        BE -->|Async Message Ingestion| BotService[Bot Service Pipeline]
        BotService -->|Academic Extraction Prompt| LLM[YandexGPT / Academic NLP]
        BotService -->|Save Message & Flashcards| DB[(MongoDB 7.0)]
        BotService -->|Dispatches Translation & Launch Button| TG
    end

    User -->|Taps 'Review Flashcards' Button| TMA[Telegram Mini App - React/Vite]
    
    subgraph "Telegram Mini App (TMA)"
        TMA -->|Cryptographic initData Handshake| Security[HMAC-SHA-256 Middleware]
        Security -->|Validated Session| FlashcardRoutes[Flashcard REST API]
        FlashcardRoutes -->|Query Due Cards / Review SM-2| DB
    end
```

---

## 🔄 End-to-End Sequence Workflows

### 1. Academic Forwarding & Term Extraction Workflow

```mermaid
sequenceDiagram
    autonumber
    actor Student as Student (Telegram)
    participant TG as Telegram Bot API
    participant Webhook as Webhook Controller
    participant Bot as Bot Service
    participant LLM as YandexGPT / Academic NLP
    participant DB as MongoDB

    Student->>TG: Forwards academic message (e.g., lecture notes, thesis notice)
    TG->>Webhook: POST /api/webhook/telegram (X-Telegram-Bot-Api-Secret-Token)
    Webhook-->>TG: 200 OK (Immediate Acknowledgment)
    Webhook-)Bot: Asynchronous message dispatch
    Bot->>TG: sendChatAction('typing')
    Bot->>DB: Upsert User (telegramId, languageCode)
    Bot->>LLM: analyzeAcademicText(russianText, 'en')
    LLM-->>Bot: { translatedText, terms: [ { originalTerm, translatedTerm, contextSentenceRu, tags } ] }
    Bot->>DB: Save Message document
    Bot->>DB: Upsert Flashcards with SM-2 defaults (interval: 0, rep: 0, EF: 2.5, nextReview: now)
    Bot->>TG: sendMessage (HTML Translation + Numbered Terminology Breakdown + 'Open Mini App' WebApp Button)
    TG-->>Student: Displays academic translation & flashcard confirmation
```

### 2. Mini App Review & SM-2 Spaced Repetition Workflow

```mermaid
sequenceDiagram
    autonumber
    actor Student as Student (Mini App)
    participant TMA as React Frontend (Vite)
    participant Guard as HMAC-SHA-256 Auth Middleware
    participant API as Flashcards API
    participant SRS as SM-2 Algorithm Service
    participant DB as MongoDB

    Student->>TMA: Opens Mini App from Telegram chat
    TMA->>TMA: @twa-dev/sdk WebApp.ready() & expand()
    TMA->>Guard: GET /api/flashcards/due (Authorization: tma <initData>)
    Guard->>Guard: Verify HMAC-SHA-256("WebAppData", BOT_TOKEN) & auth_date freshness
    Guard->>API: Validated req.userDoc & req.telegramUser
    API->>DB: find({ userId, nextReviewDate: { $lte: now } }).sort({ nextReviewDate: 1 })
    DB-->>TMA: Due flashcards array
    TMA-->>Student: Displays 3D interactive flip card (Russian term + context)
    Student->>TMA: Taps card (3D flip reveals English translation)
    Student->>TMA: Clicks rating ("Again", "Hard", "Good", or "Easy")
    TMA->>Guard: POST /api/flashcards/:id/review { rating: 'good' }
    Guard->>API: reviewFlashcard()
    API->>SRS: calculateNextReview({ repetition, interval, easeFactor, grade: 4 })
    SRS-->>API: { nextRepetition, nextInterval, nextEaseFactor, nextReviewDate }
    API->>DB: Update Flashcard metrics & lastReviewedAt
    DB-->>TMA: 200 OK { reviewSummary }
    TMA->>TMA: Haptic feedback & advance to next due card
```

---

## 🔐 Cryptographic Security & Telegram Verification

The system complies with Telegram's official cryptographic authentication specification:

```mermaid
flowchart LR
    A[Raw initData Query String] --> B[Extract hash & auth_date]
    B --> C[Verify auth_date < 24h]
    A --> D[Sort key=value pairs alphabetically]
    D --> E[Build data-check-string with \n]
    F[BOT_TOKEN] --> G[HMAC-SHA-256 with 'WebAppData']
    G --> H[Secret Key]
    E & H --> I[Calculate HMAC-SHA-256 Signature]
    I & B --> J{crypto.timingSafeEqual}
    J -->|Valid| K[Authenticate User & Upsert MongoDB]
    J -->|Invalid / Expired| L[401 Unauthorized Rejection]
```

---

## 📂 Repository Structure

```
RuScholar-TMA/
├── backend/                           # Node.js + Express + TypeScript API
│   ├── src/
│   │   ├── config/                    # Validated environment & MongoDB lifecycle
│   │   ├── controllers/               # Webhook & Flashcard REST controllers
│   │   ├── middlewares/               # HMAC-SHA-256 validator & error handlers
│   │   ├── models/                    # Mongoose schemas (User, Message, Flashcard)
│   │   ├── routes/                    # Express modular route definitions
│   │   ├── services/                  # Telegram Bot, LLM NLP, and SM-2 services
│   │   └── types/                     # Strict TypeScript interfaces
│   ├── tests/                         # Unit tests (HMAC, SM-2, and LLM)
│   ├── Dockerfile                     # Multi-stage production container
│   └── README.md                      # Backend technical documentation
├── frontend/                          # React 19 + TypeScript + Vite Mini App
│   ├── src/
│   │   ├── api/                       # Axios client with initData interceptors
│   │   ├── components/                # 3D Flip Card, Tabs, Navbar, Dictionary
│   │   ├── context/                   # TelegramContext wrapping @twa-dev/sdk
│   │   └── hooks/                     # useTelegram hook
│   ├── nginx.conf                     # Production Nginx with Gzip & CSP headers
│   ├── Dockerfile                     # Multi-stage Nginx Alpine container
│   └── README.md                      # Frontend technical documentation
├── docker-compose.yml                 # Orchestration for Mongo, Backend, Frontend
├── LICENSE                            # MIT License
└── README.md                          # Root system architecture documentation
```

---

## 🚀 Quick Start & Installation

### Option 1: Docker Compose (Recommended)

To spin up MongoDB, the Backend API, and the Frontend Nginx web server in isolated containers:

```bash
# 1. Clone repository
git clone https://github.com/SaadRimeh/RuScholar-TMA.git
cd RuScholar-TMA

# 2. Copy environment templates
cp backend/.env.example backend/.env

# 3. Launch the container stack
docker compose up -d --build
```
* **Frontend TMA**: `http://localhost:8080`
* **Backend API**: `http://localhost:5000/api`
* **MongoDB**: `localhost:27017`

### Option 2: Local Development Setup

#### Backend Setup:
```bash
cd backend
npm install
cp .env.example .env
npm test            # Runs cryptographic & SM-2 test suites
npm run dev         # Launches server on http://localhost:5000 with hot-reload
```

#### Frontend Setup:
```bash
cd frontend
npm install
npm run dev         # Launches Vite dev server on http://localhost:5173
```

---

## 🧪 Automated Testing & Verification

The backend includes cross-platform automated test suites covering:
* **HMAC-SHA-256 Authentication**: Legitimate signature validation, tampered hash detection, spoofed payload protection, and 24-hour expiration replay defense.
* **SuperMemo SM-2 Engine**: Mathematical verification of ease factor dynamics, interval scaling, and failure resets.
* **Academic NLP Parser**: Academic term deconstruction and sentence context extraction.

```bash
cd backend
npm test
```

---

## 📄 License

This project is open-sourced under the **MIT License**. See the [LICENSE](LICENSE) file for details.

---

## 📬 Contact & Author Information

Developed with high engineering standards for academic evaluation in the **Master's in Software Engineering Program** (**Open Doors Russian Scholarship Project**):

* **Author**: Saad Rimeh
* **Email**: [Saad.rimeh.01@gmail.com](mailto:Saad.rimeh.01@gmail.com)
* **GitHub**: [https://github.com/SaadRimeh/RuScholar-TMA](https://github.com/SaadRimeh/RuScholar-TMA)
* **Expertise**: Full-Stack Architecture, Node.js/TypeScript, React Ecosystem, Distributed Systems, Telegram Mini Apps.