# AI Agents Implementation Guide

This guide provides ideas and implementation strategies for integrating AI agents into Academic Buddy.

## Overview

Your project already has the foundation for AI features:
- Database models: `AISuggestion`, `SourceMaterial`, `Flashcard`, `Quiz`
- API keys configured: Gemini and Groq
- Rich data: tasks, projects, pomodoro logs, analytics

## Implemented Agents

### 1. Task Breakdown Agent ✅
**Status**: Implemented
**Location**: `src/lib/ai-agents/task-breakdown-agent.ts`
**API**: `POST /api/tasks/suggest-breakdown`

Automatically suggests subtasks for complex tasks.

**Usage Example**:
```typescript
// Frontend call
const response = await fetch('/api/tasks/suggest-breakdown', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: 'Study for Biology Exam',
    description: 'Chapters 1-5, focus on cell biology',
    estimatedMinutes: 180
  })
});

const { subtasks, reasoning } = await response.json();
// subtasks: [{ title: "Review chapter 1", estimatedMinutes: 30, order: 1 }, ...]
```

## Recommended Agents to Implement

### 2. Focus Pattern Analyzer
**Priority**: High
**Complexity**: Medium
**Value**: Personalized productivity insights

Analyzes `pomodoroLogs` to identify when users are most productive.

**Implementation Steps**:
1. Create `src/lib/ai-agents/focus-analyzer-agent.ts`
2. Query `pomodoroLogs` grouped by hour, day of week
3. Analyze `focusScore` patterns
4. Generate insights using LLM
5. Store in `AISuggestion` table with type `STUDY_SESSION`

**Prompt Template**:
```
Analyze this user's focus patterns:
- Best focus times: [9am-11am: avg score 8.5, 2pm-4pm: avg score 6.2]
- Worst times: [8pm-10pm: avg score 4.1]
- Total sessions: 45 over 2 weeks

Provide 3 actionable recommendations for optimizing their study schedule.
```

### 3. Deadline Risk Detector
**Priority**: High
**Complexity**: Low
**Value**: Prevents missed deadlines

Identifies tasks at risk of missing deadlines.

**Implementation Steps**:
1. Create scheduled job (daily at 8am)
2. Query tasks with `dueDate` in next 7 days
3. Compare `estimatedMinutes` vs available time
4. Factor in user's average `actualMinutes` vs `estimatedMinutes` ratio
5. Create `RESCHEDULE_TASK` suggestions for at-risk tasks

**Algorithm**:
```typescript
const timeRemaining = dueDate - now;
const estimatedTime = task.estimatedMinutes * userOverestimationFactor;
const availableFocusTime = avgDailyFocusMinutes * daysRemaining;

if (estimatedTime > availableFocusTime * 0.8) {
  // Task is at risk!
  createSuggestion({
    type: 'RESCHEDULE_TASK',
    content: {
      taskId: task.id,
      reason: 'Insufficient time before deadline',
      suggestion: 'Break into smaller tasks or extend deadline'
    }
  });
}
```

### 4. Smart Flashcard Generator
**Priority**: Medium
**Complexity**: High
**Value**: Automated study material creation

Generates flashcards from uploaded PDFs.

**Implementation Steps**:
1. Create `src/lib/ai-agents/flashcard-generator-agent.ts`
2. Hook into `SourceMaterial` upload
3. Extract text (use existing `extractedText` field)
4. Use LLM to generate Q&A pairs
5. Bulk insert into `Flashcard` table
6. Set `difficulty` based on concept complexity

**Prompt Template**:
```
Generate flashcards from this study material:

[EXTRACTED_TEXT]

Create 10-15 flashcards covering key concepts. For each:
- Question: Clear, specific question
- Answer: Concise but complete answer
- Difficulty: 1-5 (1=basic definition, 5=complex application)

Format as JSON array.
```

### 5. Quiz Question Generator
**Priority**: Medium
**Complexity**: High
**Value**: Practice test creation

Similar to flashcard generator but creates multiple-choice quizzes.

**Implementation Steps**:
1. Create `src/lib/ai-agents/quiz-generator-agent.ts`
2. Process `SourceMaterial.extractedText`
3. Generate questions with 4 options each
4. Create `Quiz` and `QuizQuestion` records
5. Include explanations for correct answers

**Prompt Template**:
```
Create a 10-question multiple choice quiz from this material:

[EXTRACTED_TEXT]

For each question:
- Question text
- 4 options (A, B, C, D)
- Correct answer
- Brief explanation
- Difficulty (1-5)

Ensure questions test understanding, not just memorization.
```

### 6. Burnout Prevention Agent
**Priority**: High
**Complexity**: Low
**Value**: User wellbeing

Monitors work patterns and suggests breaks.

**Implementation Steps**:
1. Create scheduled job (runs every hour)
2. Check recent `pomodoroLogs` (last 4 hours)
3. Detect patterns:
   - 4+ consecutive sessions without long break
   - Declining `focusScore` trend
   - Late night sessions (after 10pm)
4. Create `BREAK_REMINDER` suggestions

**Detection Logic**:
```typescript
// Check for consecutive sessions
const recentSessions = await prisma.pomodoroLog.findMany({
  where: {
    userId: user.id,
    startedAt: { gte: fourHoursAgo }
  },
  orderBy: { startedAt: 'asc' }
});

const consecutiveSessions = countConsecutive(recentSessions);
if (consecutiveSessions >= 4) {
  createSuggestion({
    type: 'BREAK_REMINDER',
    content: {
      message: 'You\'ve completed 4 focus sessions. Take a 15-minute break!',
      severity: 'medium'
    }
  });
}
```

### 7. Study Session Optimizer
**Priority**: Medium
**Complexity**: High
**Value**: Personalized scheduling

Creates optimal study plans based on tasks and focus patterns.

**Implementation Steps**:
1. Combine Focus Pattern Analyzer data
2. List upcoming tasks with deadlines
3. Use LLM to create weekly study schedule
4. Consider:
   - Task priorities
   - User's peak focus times
   - Estimated time requirements
   - Deadline urgency
5. Create `STUDY_SESSION` suggestions

**Prompt Template**:
```
Create an optimal study schedule for this week:

User's Peak Focus Times:
- Monday-Friday: 9am-11am (score: 8.5)
- Weekends: 2pm-5pm (score: 7.8)

Upcoming Tasks:
1. Biology Exam (due Friday, 3 hours estimated)
2. Math Assignment (due Wednesday, 2 hours)
3. History Essay (due next Monday, 4 hours)

Available study time: 3 hours/day weekdays, 5 hours/day weekends

Generate a day-by-day schedule optimizing for peak focus times.
```

## Implementation Architecture

### Agent Base Class

Create a reusable base class for all agents:

```typescript
// src/lib/ai-agents/base-agent.ts
export abstract class BaseAgent {
  protected llm: LLMProvider; // Gemini or Groq
  
  abstract execute(input: any): Promise<any>;
  
  protected async generateContent(prompt: string): Promise<string> {
    // Shared LLM call logic
  }
  
  protected async createSuggestion(
    userId: string,
    type: SuggestionType,
    content: any
  ): Promise<void> {
    await prisma.aiSuggestion.create({
      data: { userId, type, content, status: 'PENDING' }
    });
  }
}
```

### Scheduled Jobs

Use a job scheduler for periodic agents:

```typescript
// src/lib/ai-agents/scheduler.ts
import cron from 'node-cron';

export function startAgentScheduler() {
  // Run burnout prevention every hour
  cron.schedule('0 * * * *', async () => {
    await runBurnoutPreventionAgent();
  });
  
  // Run deadline risk detector daily at 8am
  cron.schedule('0 8 * * *', async () => {
    await runDeadlineRiskDetector();
  });
  
  // Run focus analyzer weekly on Sunday
  cron.schedule('0 9 * * 0', async () => {
    await runFocusAnalyzer();
  });
}
```

### API Endpoints

Create consistent API structure:

```
POST /api/ai/suggest-breakdown      - Task breakdown
POST /api/ai/generate-flashcards    - Flashcard generation
POST /api/ai/generate-quiz          - Quiz generation
GET  /api/ai/suggestions            - Get pending suggestions
PUT  /api/ai/suggestions/:id        - Accept/reject suggestion
GET  /api/ai/insights               - Get focus insights
```

## Data Flow

```
User Action → Agent Trigger → LLM Processing → Store Suggestion → User Reviews → Update Analytics
```

### Example: Task Creation Flow

1. User creates task "Study for Biology Exam"
2. Frontend calls `/api/tasks/suggest-breakdown`
3. Agent analyzes task complexity
4. If complex, generates subtask suggestions
5. Returns suggestions to frontend
6. User reviews and accepts/modifies
7. Subtasks created with `parentTaskId`
8. Analytics updated: `aiSuggestionsAccepted++`

## Cost Optimization

### Caching
Cache LLM responses for similar queries:

```typescript
const cacheKey = `task-breakdown:${hash(title)}`;
const cached = await redis.get(cacheKey);
if (cached) return JSON.parse(cached);

const result = await agent.breakdownTask(title);
await redis.setex(cacheKey, 3600, JSON.stringify(result));
```

### Rate Limiting
Limit AI operations per user:

```typescript
// 10 AI requests per hour per user
const aiRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  keyGenerator: (req) => `ai:${req.user.id}`
});
```

### Batch Processing
Process multiple items in one LLM call:

```typescript
// Instead of 10 separate calls for 10 flashcards
// Make 1 call asking for 10 flashcards
const prompt = `Generate 10 flashcards from: ${text}`;
```

## Testing Strategy

### Unit Tests
```typescript
describe('TaskBreakdownAgent', () => {
  it('should break down complex tasks', async () => {
    const agent = new TaskBreakdownAgent();
    const result = await agent.breakdownTask(
      'Study for Biology Exam',
      'Chapters 1-5',
      180
    );
    
    expect(result.subtasks).toHaveLength(3);
    expect(result.subtasks[0]).toHaveProperty('title');
  });
});
```

### Integration Tests
```typescript
describe('POST /api/tasks/suggest-breakdown', () => {
  it('should return subtask suggestions', async () => {
    const response = await request(app)
      .post('/api/tasks/suggest-breakdown')
      .send({ title: 'Complex Task', estimatedMinutes: 120 })
      .expect(200);
      
    expect(response.body.subtasks).toBeDefined();
  });
});
```

## Monitoring

Track agent performance:

```typescript
// Add to metrics
export const aiAgentMetrics = {
  suggestionsGenerated: 0,
  suggestionsAccepted: 0,
  suggestionsRejected: 0,
  averageResponseTime: 0,
  llmErrors: 0
};
```

## Next Steps

1. **Start Simple**: Implement Task Breakdown Agent (already done!)
2. **Add Frontend UI**: Create suggestion review interface
3. **Implement Burnout Prevention**: High value, low complexity
4. **Add Deadline Risk Detector**: Prevents missed deadlines
5. **Build Focus Analyzer**: Personalized insights
6. **Create Content Generators**: Flashcards and quizzes

## Resources

- Gemini API Docs: https://ai.google.dev/docs
- Groq API Docs: https://console.groq.com/docs
- Your existing models: `prisma/schema.prisma`
- Analytics tracking: Already in place via `Analytics` model

## Questions to Consider

1. **Which agent provides the most value to your users?**
   - Start with that one first

2. **Do you want real-time or scheduled agents?**
   - Real-time: Respond to user actions immediately
   - Scheduled: Run periodically in background

3. **How will users interact with suggestions?**
   - Auto-apply? Review first? Dismiss?

4. **What's your LLM budget?**
   - Affects how aggressive agents can be

5. **Privacy concerns?**
   - Keep user data secure, don't send PII to LLMs
