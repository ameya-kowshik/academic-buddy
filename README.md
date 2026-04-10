<div align="center">

# 🧠 Academic Buddy

**An AI-Powered Personalized Study Assistant**

[![Next.js](https://img.shields.io/badge/Next.js-15.5.2-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6.x-2D3748?style=for-the-badge&logo=prisma)](https://www.prisma.io/)
[![Firebase](https://img.shields.io/badge/Firebase-Auth-orange?style=for-the-badge&logo=firebase)](https://firebase.google.com/)
[![Groq](https://img.shields.io/badge/Groq-LLaMA_3.3_70B-purple?style=for-the-badge)](https://groq.com/)

</div>

---

Academic Buddy transforms your PDF study materials into interactive learning experiences using AI. Upload a document, generate flashcards and quizzes automatically, track your performance over time, and let a suite of intelligent agents surface exactly where you need to improve — all in real time.

---

## Features

### AI Content Generation
- Upload any PDF and generate flashcards or quizzes in seconds
- Powered by Groq API with LLaMA 3.3 70B
- Configurable question count (1–50) and difficulty levels (1–5)
- Multiple-choice quizzes with per-question explanations

### Flashcards
- AI-generated question/answer pairs from your documents
- Difficulty ratings (1–5) per card, grouping by topic
- Review mode with flip animation and review count tracking
- Flashcard sessions recorded with actual duration for accurate analytics

### Adaptive Quizzes
- Timed or free-form sessions with per-question answer tracking
- Detailed results page: score, correct answers, time spent, per-question review
- Attempt history with score trend across retakes
- Duplicate attempt guard — resuming a quiz returns the existing in-progress attempt instead of creating a new one

### Study Analytics
- Dashboard showing flashcards reviewed, quizzes completed, average score, and total study time
- Configurable time ranges: 7, 30, or 90 days
- Weak areas detection — identifies topics and difficulty levels where you score below 70%
- AI-powered weak area analysis using LLM reasoning over your attempt history (cached per attempt, never re-generated)

### Focus Sessions
- Pomodoro timer and stopwatch mode
- Session tagging, notes, and optional quiz/flashcard linking for study material tracking
- Focus time tracked in analytics and fed into agent analysis

### Agentic Intelligence
Four autonomous agents run in the background and surface insights in the UI:

| Agent | Trigger | What it does |
|---|---|---|
| Focus Coach | After every focus session (inline) | Detects declining scores, high duration variance, and intensive study patterns. Returns suggestions immediately in the session save response. |
| Study Companion | After quiz completion + weekly | Identifies knowledge gaps from wrong answers, recommends source material review, tracks progress trend across retakes. |
| Productivity Analyst | Weekly | Computes weekly productivity score, detects burnout risk via linear regression on focus hours, sends email report. |
| Reflection Agent | Weekly + monthly | Cross-domain correlation between focus hours and quiz scores, period-over-period comparison, synthesizes outputs from other agents into a narrative reflection. Sends email report. |

Agent outputs are stored per-user and surfaced in dedicated dashboards. All agents are fire-and-forget — failures never affect the user-facing response.

### Authentication
- Firebase Authentication (Google + Email/Password)
- Per-user data isolation — all content is private to each account
- Server-side Firebase token verification on every API route

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15.5.2 (App Router) |
| Language | TypeScript |
| Database | PostgreSQL (Neon) |
| ORM | Prisma 6.x |
| Auth | Firebase Authentication + Firebase Admin SDK |
| AI | Groq API — LLaMA 3.3 70B |
| PDF Parsing | pdf2json |
| Email | Brevo (Sendinblue) |
| UI | Tailwind CSS v4, Radix UI, shadcn/ui, Recharts |
| Rate Limiting | Upstash Redis (optional, falls back to in-memory) |
| Error Monitoring | Sentry (optional) |
| Testing | Vitest + Testing Library |

---

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL database (local or [Neon](https://neon.tech))
- Firebase project with Authentication enabled
- Groq API key — free at [console.groq.com](https://console.groq.com)

### Setup

```bash
git clone https://github.com/your-username/academic-buddy.git
cd academic-buddy
npm install
cp .env.example .env
```

Fill in your `.env` (see the Environment Variables section below), then:

```bash
npx prisma generate
npx prisma db push
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Environment Variables

Required variables are marked. Everything else is optional.

```env
# Database — Required
DATABASE_URL="postgresql://user:password@host-pooler/dbname?sslmode=require"
DIRECT_URL="postgresql://user:password@host/dbname?sslmode=require"

# Firebase Client SDK — Required
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Firebase Admin SDK — Required (paste full service account JSON as single-line string)
FIREBASE_SERVICE_ACCOUNT_KEY='{ ... }'

# AI — Required
GROQ_API_KEY=

# App — Required
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXTAUTH_SECRET=                  # generate: openssl rand -base64 32

# Scheduled agent triggers — Required for cron jobs
CRON_SECRET=                      # generate: openssl rand -base64 32

# Email (Brevo) — Optional, agents send reports when configured
BREVO_API_KEY=
BREVO_SENDER_EMAIL=
BREVO_SENDER_NAME=

# Redis / Upstash — Optional, used for rate limiting and caching
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# Sentry — Optional
SENTRY_DSN=
NEXT_PUBLIC_SENTRY_DSN=
DISABLE_SENTRY=true
```

See `.env.example` for the full list with descriptions.

---

## API Reference

All routes require a Firebase Bearer token in the `Authorization` header unless noted.

### Documents
```
GET    /api/documents              list user's documents (supports ?tags= filter)
POST   /api/documents              upload a PDF (multipart/form-data)
GET    /api/documents/[id]         get a single document
DELETE /api/documents/[id]         delete a document
PATCH  /api/documents/[id]/tags    update document tags
```

### AI Generation
```
POST /api/ai/generate-flashcards   generate flashcards from a document
POST /api/ai/generate-quiz         generate a quiz from a document
POST /api/ai/analyze-weak-areas    LLM analysis of quiz attempt history (cached per attempt)
```

### Flashcards
```
GET    /api/flashcards             list flashcards (supports grouping/difficulty/tag filters)
POST   /api/flashcards             create a flashcard
GET    /api/flashcards/[id]        get a flashcard
PUT    /api/flashcards/[id]        update a flashcard
DELETE /api/flashcards/[id]        delete a flashcard
POST   /api/flashcards/[id]/review record a review event (increments count, updates lastReviewed)
POST   /api/flashcard-sessions     record a completed flashcard review session
```

### Quizzes
```
GET    /api/quizzes                          list quizzes
POST   /api/quizzes                          create a quiz
GET    /api/quizzes/[id]                     get quiz with questions
PUT    /api/quizzes/[id]                     update quiz metadata
DELETE /api/quizzes/[id]                     delete quiz
POST   /api/quizzes/[id]/questions           add a question
GET    /api/quizzes/[id]/attempts            get attempt history
POST   /api/quizzes/[id]/attempts            start a new attempt (idempotent — returns existing in-progress attempt)
GET    /api/quizzes/attempts/[id]            get attempt with full question review
POST   /api/quizzes/attempts/[id]/answers    submit an answer (ownership validated)
POST   /api/quizzes/attempts/[id]/complete   complete the attempt and calculate score (ownership validated)
PUT    /api/quizzes/questions/[id]           update a question
DELETE /api/quizzes/questions/[id]           delete a question
```

### Analytics
```
GET /api/analytics/study                 study stats for a date range (?startDate=&endDate=)
GET /api/analytics/weak-areas            weak areas from quiz performance
GET /api/analytics/study-material-focus  focus time per study material
```

### Focus Sessions
```
GET  /api/focus-sessions   list sessions (supports date range, tag, pagination)
POST /api/focus-sessions   save a completed session (triggers Focus Coach inline)
```

### Agents
```
GET  /api/agents/outputs              list agent outputs for the current user
POST /api/agents/outputs/[id]/view    mark an output as viewed
POST /api/agents/outputs/[id]/dismiss dismiss an output
POST /api/agents/scheduled-trigger    trigger weekly/monthly agents (requires CRON_SECRET)
```

---

## Agentic System Architecture

```
Focus Session saved
        │
        ▼
  FocusCoachAgent (inline, ~5ms)
  Returns suggestions in the same response

Quiz completed
        │
        ▼
  EventBus.publishEvent(QUIZ_COMPLETED)
        │
        ├──▶ StudyCompanionAgent (async, fire-and-forget)

Cron: POST /api/agents/scheduled-trigger { "type": "weekly" }
        │
        ▼
  EventBus.publishEvent(WEEKLY_TRIGGER) per user
        │
        ├──▶ ProductivityAnalystAgent
        ├──▶ StudyCompanionAgent
        └──▶ ReflectionAgent

Cron: POST /api/agents/scheduled-trigger { "type": "monthly" }
        │
        └──▶ ReflectionAgent
```

- Deduplication: agents skip execution if the same agent/user/event ran within the last 60 seconds
- All async agents are fire-and-forget — failures are logged to `AgentExecution` but never surface to the user
- Outputs are stored in `AgentOutput` and retrieved via `/api/agents/outputs`

### Setting up scheduled triggers

Use any cron provider (Vercel Crons, cron-job.org, GitHub Actions) to call:

```
POST https://your-app.vercel.app/api/agents/scheduled-trigger?secret=YOUR_CRON_SECRET
Content-Type: application/json

{ "type": "weekly" }
```

For Vercel Crons, add to `vercel.json`:

```json
{
  "crons": [
    { "path": "/api/agents/scheduled-trigger?secret=YOUR_CRON_SECRET&type=weekly", "schedule": "0 9 * * 1" },
    { "path": "/api/agents/scheduled-trigger?secret=YOUR_CRON_SECRET&type=monthly", "schedule": "0 9 1 * *" }
  ]
}
```

---

## Database Schema

Key models in `prisma/schema.prisma`:

| Model | Description |
|---|---|
| `User` | Synced from Firebase on first login |
| `SourceMaterial` | Uploaded PDFs with extracted text |
| `Flashcard` | AI-generated Q&A cards, linked to a source material |
| `FlashcardSession` | Records of completed review sessions with actual duration |
| `Quiz` + `QuizQuestion` | AI-generated quizzes with multiple-choice questions |
| `QuizAttempt` + `QuizQuestionAttempt` | Per-attempt tracking with per-question correctness |
| `Analytics` | Daily aggregated study stats (flashcards reviewed, quizzes completed) |
| `PomodoroLog` | Focus session records with duration, type, score, and material links |
| `Tag` | User-defined labels for focus sessions |
| `AgentExecution` | Audit log of every agent run with status and error |
| `AgentOutput` | Structured output from agents, with viewed/dismissed state |

---

## Project Structure

```
academic-buddy/
├── prisma/
│   └── schema.prisma
├── src/
│   ├── app/
│   │   ├── api/                  # All API routes
│   │   │   ├── agents/           # Agent outputs + scheduled trigger
│   │   │   ├── ai/               # Flashcard/quiz generation, weak area analysis
│   │   │   ├── analytics/        # Study stats, weak areas, material focus
│   │   │   ├── documents/        # PDF upload and management
│   │   │   ├── flashcard-sessions/
│   │   │   ├── flashcards/
│   │   │   ├── focus-sessions/
│   │   │   └── quizzes/
│   │   ├── focus/                # Focus timer + analytics pages
│   │   ├── login/ signup/        # Auth pages
│   │   ├── profile/              # User settings
│   │   ├── reflection/           # Reflection agent dashboard
│   │   └── study/                # Documents, flashcards, quizzes, analytics
│   ├── components/
│   │   ├── agents/               # FocusCoachNotification, ReflectionDashboard,
│   │   │                         # StudyCompanionDashboard, ProductivityAnalystDashboard
│   │   ├── analytics/            # StudyAnalyticsDashboard, WeakAreas, QuizHistory
│   │   ├── documents/            # DocumentUpload, DocumentList, AIFlashcardGenerator,
│   │   │                         # AIQuizGenerator
│   │   ├── flashcards/           # FlashcardForm, FlashcardList, FlashcardReview
│   │   ├── focus/                # Timer, controls, session modal
│   │   ├── layout/               # Sidebar, navigation
│   │   └── quizzes/              # QuizForm, QuizList, QuizTaking, QuizResults,
│   │                             # QuizAttemptHistory
│   ├── lib/
│   │   ├── agents/               # Agent implementations + core infrastructure
│   │   │   ├── base/             # Agent base class and event types
│   │   │   ├── core/             # EventBus, AgentRegistry, OutputStorageService,
│   │   │   │                     # EmailService, ScheduledTriggerService
│   │   │   ├── FocusCoachAgent.ts
│   │   │   ├── ProductivityAnalystAgent.ts
│   │   │   ├── ReflectionAgent.ts
│   │   │   ├── StudyCompanionAgent.ts
│   │   │   └── index.ts          # Singleton wiring
│   │   └── services/             # Business logic
│   │       ├── ai.service.ts
│   │       ├── analytics.service.ts
│   │       ├── document.service.ts
│   │       ├── flashcard.service.ts
│   │       └── quiz.service.ts
│   ├── middleware/
│   │   ├── auth.ts               # Firebase token verification (uses shared Prisma singleton)
│   │   ├── rateLimit.ts          # Per-IP rate limiting with Upstash Redis
│   │   └── validation.ts         # Zod request body validation
│   └── schemas/                  # Zod schemas for all request bodies
└── scripts/
    ├── demo-seed.mjs             # Seeds demo data for presentations
    └── demo-run-agents.mjs       # Manually triggers all agents for a user
```

---

## Testing

```bash
npm test              # run all tests once
npm run test:watch    # watch mode
npm run test:ui       # Vitest UI
```

Tests live in `__tests__` folders co-located with the source files they cover. The test suite covers all service methods, API routes, and key components.

---

## Scripts

```bash
npm run dev           # start dev server (Turbopack)
npm run build         # production build
npm run lint          # ESLint
node scripts/demo-seed.mjs          # seed demo data
node scripts/demo-run-agents.mjs    # trigger agents for a demo user
node scripts/test-email.mjs         # send a test email via Brevo
```

---

## License

MIT
