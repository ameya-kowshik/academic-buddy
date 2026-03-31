<div align="center">
  
  # 🧠 Academic Buddy
  
  **An AI-Powered Personalized Study Assistant**
  
  [![Next.js](https://img.shields.io/badge/Next.js-15.5.2-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
  [![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=for-the-badge&logo=prisma)](https://www.prisma.io/)
  [![Firebase](https://img.shields.io/badge/Firebase-Auth-orange?style=for-the-badge&logo=firebase)](https://firebase.google.com/)
  [![Groq](https://img.shields.io/badge/Groq-LLaMA_3.3_70B-purple?style=for-the-badge)](https://groq.com/)
  
</div>

---

Academic Buddy transforms your PDF study materials into interactive learning experiences using AI. Upload a document, get flashcards and quizzes generated automatically, track your performance over time, and let the analytics surface exactly where you need to improve.

---

## Features

### AI Content Generation
- Upload any PDF and generate flashcards or quizzes in seconds
- Powered by Groq API with LLaMA 3.3 70B
- Configurable question count and difficulty levels
- Multiple choice quizzes with explanations for each answer

### Flashcards
- AI-generated question/answer pairs from your documents
- Difficulty ratings (1–5) per card
- Review mode with flip animation
- Grouped by document/topic

### Adaptive Quizzes
- Timed sessions (1–180 minutes) with countdown timer
- One-at-a-time or all-at-once viewing modes
- Per-question answer tracking during the session
- Detailed results with score, correct answers, and time spent

### Study Analytics
- Dashboard showing flashcards reviewed, quizzes completed, average score, total study time
- Configurable time ranges: 7, 30, or 90 days
- Quiz attempt history with score trends
- Weak areas detection — identifies topics and difficulty levels where you score below 70%
- AI-powered weak area analysis using LLM reasoning over your attempt history

### Focus Sessions
- Pomodoro timer with configurable focus/break durations
- Stopwatch mode for free-form sessions
- Session tagging and notes
- Focus time tracked in analytics

### Authentication
- Firebase Authentication (Google + Email/Password)
- Per-user data isolation — all content is private to each account
- Server-side token verification on every API route

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15.5.2 (App Router) |
| Language | TypeScript |
| Database | PostgreSQL (Neon) |
| ORM | Prisma |
| Auth | Firebase Authentication |
| AI | Groq API — LLaMA 3.3 70B |
| PDF Parsing | pdf2json |
| UI | Tailwind CSS, Radix UI, shadcn/ui |
| Error Monitoring | Sentry (optional) |

---

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL database (local or [Neon](https://neon.tech))
- Firebase project
- Groq API key (free at [console.groq.com](https://console.groq.com))

### Setup

```bash
git clone https://github.com/your-username/academic-buddy.git
cd academic-buddy
npm install
cp .env.example .env
```

Fill in your `.env` file (see `.env.example` for all required variables), then:

```bash
npx prisma generate
npx prisma db push
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Environment Variables

```env
# Database
DATABASE_URL="postgresql://..."

# Firebase (client)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Firebase Admin (server)
FIREBASE_SERVICE_ACCOUNT_KEY='{ ... }'

# AI
GROQ_API_KEY=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

---

## API Overview

### Documents
```
GET    /api/documents          — list user's documents
POST   /api/documents          — upload a PDF
DELETE /api/documents/[id]     — delete a document
```

### AI Generation
```
POST /api/ai/generate-flashcards   — generate flashcards from a document
POST /api/ai/generate-quiz         — generate a quiz from a document
POST /api/ai/analyze-weak-areas    — LLM analysis of quiz attempt history
```

### Flashcards
```
GET    /api/flashcards          — list flashcards
POST   /api/flashcards          — create flashcard
PUT    /api/flashcards/[id]     — update flashcard
DELETE /api/flashcards/[id]     — delete flashcard
POST   /api/flashcards/[id]/review — record a review event
```

### Quizzes
```
GET    /api/quizzes                              — list quizzes
POST   /api/quizzes                              — create quiz
GET    /api/quizzes/[id]                         — get quiz with questions
POST   /api/quizzes/[id]/attempts                — start an attempt
POST   /api/quizzes/attempts/[id]/answers        — submit an answer
POST   /api/quizzes/attempts/[id]/complete       — complete the attempt
```

### Analytics
```
GET /api/analytics/study                — study stats for a date range
GET /api/analytics/weak-areas           — weak areas from quiz performance
GET /api/analytics/study-material-focus — focus time per topic
```

### Focus Sessions
```
GET  /api/focus-sessions   — list sessions
POST /api/focus-sessions   — save a completed session
```

---

## Database Schema (key models)

- `User` — synced from Firebase on first login
- `Document` — uploaded PDFs with extracted text
- `Flashcard` — AI-generated Q&A cards linked to a document
- `Quiz` + `QuizQuestion` — AI-generated quizzes
- `QuizAttempt` + `QuizAnswer` — per-attempt tracking
- `Analytics` — daily aggregated study stats
- `PomodoroLog` — focus session records
- `Tag` — user-defined labels for sessions

---

## Testing

```bash
npm test              # run all tests
npm run test:coverage # with coverage report
```

Tests are co-located with source files in `__tests__` folders.

---

## Project Structure

```
src/
├── app/
│   ├── api/           # API routes
│   ├── study/         # Flashcard and quiz pages
│   ├── analytics/     # Analytics dashboard
│   ├── focus/         # Focus session timer
│   └── documents/     # Document management
├── components/
│   ├── analytics/     # Dashboard, weak areas, quiz history
│   ├── documents/     # Upload, list, AI generators
│   ├── flashcards/    # Review, list, form
│   ├── quizzes/       # Taking, results, history
│   └── focus/         # Timer, controls, session modal
├── lib/
│   ├── services/      # Business logic (quiz, flashcard, analytics, AI)
│   └── ...            # Utilities
├── hooks/             # useAuth, usePomodoro, useStopwatch, etc.
├── contexts/          # TimerContext
└── schemas/           # Zod validation schemas
prisma/
└── schema.prisma
```

---

## License

MIT
