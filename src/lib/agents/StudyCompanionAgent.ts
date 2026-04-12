import { prisma } from '@/lib/prisma';
import {
  Agent,
  AgentEvent,
  AgentEventType,
  AgentInput,
  AgentOutput,
  AgentOutputType,
} from './base/Agent';
import { EmailService } from './core/EmailService';
import { OutputStorageService } from './core/OutputStorageService';

type ProgressTrend = 'IMPROVING' | 'DECLINING' | 'STABLE' | 'FIRST_ATTEMPT';
type MaterialTrend = 'IMPROVING' | 'DECLINING' | 'STABLE';
type RecommendationType = 'REVIEW_MATERIAL' | 'PRACTICE_MORE' | 'FOCUS_TOPIC';
type Priority = 'LOW' | 'MEDIUM' | 'HIGH';

interface Recommendation {
  type: RecommendationType;
  materialId?: string;
  materialName?: string;
  reason: string;
  priority: Priority;
}

interface TopicAnalysis {
  topic: string;
  incorrectCount: number;
  totalAppearances: number;
  errorRate: number;
  quizTitles: string[];
  sourceMaterial?: {
    id: string;
    fileName: string;
  };
  recommendation: string;
}

interface QuizTriggerContext {
  triggerType: 'QUIZ_COMPLETED';
  attempt: {
    id: string;
    score: number;
    quizId: string;
    quiz: {
      id: string;
      title: string;
      sourceMaterialId: string | null;
      sourceMaterial: { id: string; fileName: string } | null;
    };
    questionAttempts: Array<{
      isCorrect: boolean;
      quizQuestion: { questionText: string };
    }>;
  };
  previousAttempts: Array<{ id: string; score: number; startedAt: Date }>;
}

interface WeeklyTriggerContext {
  triggerType: 'WEEKLY_TRIGGER';
  flashcardSessions: Array<{
    id: string;
    cardCount: number;
    durationSeconds: number | null;
    sessionStartedAt: Date;
  }>;
  quizAttempts: Array<{
    id: string;
    score: number;
    completedAt: Date | null;
    quiz: {
      title: string;
      sourceMaterial: { id: string; fileName: string } | null;
    };
    questionAttempts: Array<{
      isCorrect: boolean;
      quizQuestion: { questionText: string };
    }>;
  }>;
}

type StudyCompanionContext = QuizTriggerContext | WeeklyTriggerContext;

export class StudyCompanionAgent extends Agent {
  readonly id = 'study-companion';
  readonly name = 'Study Companion';

  constructor(
    private readonly outputStorage: OutputStorageService,
    private readonly emailService: EmailService,
  ) {
    super();
  }

  async prepareInput(event: AgentEvent): Promise<AgentInput<StudyCompanionContext>> {
    if (event.type === AgentEventType.QUIZ_COMPLETED) {
      const { attemptId } = event.payload as { attemptId: string };

      const attempt = await prisma.quizAttempt.findUniqueOrThrow({
        where: { id: attemptId },
        include: {
          questionAttempts: {
            include: { quizQuestion: true },
          },
          quiz: {
            include: {
              sourceMaterial: { select: { id: true, fileName: true } },
            },
          },
        },
      });

      const previousAttempts = await prisma.quizAttempt.findMany({
        where: { quizId: attempt.quizId },
        orderBy: { startedAt: 'desc' },
        take: 5,
        select: { id: true, score: true, startedAt: true },
      });

      return {
        userId: event.userId,
        event,
        context: {
          triggerType: 'QUIZ_COMPLETED',
          attempt,
          previousAttempts,
        },
      };
    }

    // WEEKLY_TRIGGER
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const userId = event.userId;

    const flashcardSessions = await prisma.flashcardSession.findMany({
      where: { userId, sessionStartedAt: { gte: sevenDaysAgo } },
      select: { id: true, cardCount: true, durationSeconds: true, sessionStartedAt: true },
    });

    const quizAttempts = await prisma.quizAttempt.findMany({
      where: {
        quiz: { userId },
        completedAt: { gte: sevenDaysAgo },
      },
      include: {
        quiz: {
          include: {
            sourceMaterial: { select: { id: true, fileName: true } },
          },
          select: {
            title: true,
            sourceMaterial: true,
          },
        },
        questionAttempts: {
          include: {
            quizQuestion: {
              select: { questionText: true },
            },
          },
        },
      },
    });

    return {
      userId: event.userId,
      event,
      context: {
        triggerType: 'WEEKLY_TRIGGER',
        flashcardSessions,
        quizAttempts,
      },
    };
  }

  async execute(input: AgentInput<StudyCompanionContext>): Promise<AgentOutput> {
    const { context } = input;

    if (context.triggerType === 'QUIZ_COMPLETED') {
      return this.executeQuizTrigger(input as AgentInput<QuizTriggerContext>);
    }
    return this.executeWeeklyTrigger(input as AgentInput<WeeklyTriggerContext>);
  }

  private async executeQuizTrigger(
    input: AgentInput<QuizTriggerContext>
  ): Promise<AgentOutput> {
    const { attempt, previousAttempts } = input.context;
    const score = attempt.score;

    // Identify incorrect questions and extract topic keywords
    const incorrectAttempts = attempt.questionAttempts.filter((qa) => !qa.isCorrect);
    const knowledgeGaps = this.extractKeywords(
      incorrectAttempts.map((qa) => qa.quizQuestion.questionText)
    );

    // Compute progress trend
    const progressTrend = this.computeProgressTrend(attempt.id, score, previousAttempts);

    // Determine priority based on score
    const priority: Priority = score < 50 ? 'HIGH' : score <= 70 ? 'MEDIUM' : 'LOW';

    // Build recommendations
    const recommendations: Recommendation[] = [];

    if (attempt.quiz.sourceMaterial) {
      const { id: materialId, fileName: materialName } = attempt.quiz.sourceMaterial;
      recommendations.push({
        type: 'REVIEW_MATERIAL',
        materialId,
        materialName,
        reason: `Your score of ${score.toFixed(1)}% suggests reviewing the source material would help.`,
        priority,
      });
    }

    if (knowledgeGaps.length > 0) {
      recommendations.push({
        type: 'FOCUS_TOPIC',
        reason: `Focus on these topics: ${knowledgeGaps.join(', ')}.`,
        priority,
      });
    }

    if (score < 70) {
      recommendations.push({
        type: 'PRACTICE_MORE',
        reason: `Retaking this quiz will reinforce the material and improve retention.`,
        priority,
      });
    }

    const content = {
      quizScore: score,
      knowledgeGaps,
      recommendations,
      progressTrend,
    };

    return {
      agentId: this.id,
      userId: input.userId,
      outputType: AgentOutputType.RECOMMENDATION,
      content,
      explainability: {
        reasoning: `Quiz score: ${score.toFixed(1)}%. Progress trend: ${progressTrend}. ${incorrectAttempts.length} incorrect answers identified.`,
        dataSourcesUsed: [attempt.id],
        analysisMethod: 'quiz-performance-analysis',
        keyFactors: {
          score,
          incorrectCount: incorrectAttempts.length,
          totalQuestions: attempt.questionAttempts.length,
          progressTrend,
          previousAttemptCount: previousAttempts.length,
        },
      },
      timestamp: new Date(),
      confidence: previousAttempts.length >= 3 ? 0.85 : previousAttempts.length >= 1 ? 0.65 : 0.4,
    };
  }

  private async executeWeeklyTrigger(
    input: AgentInput<WeeklyTriggerContext>
  ): Promise<AgentOutput> {
    const { flashcardSessions, quizAttempts } = input.context;

    const totalFlashcardSessions = flashcardSessions.length;
    const totalFlashcardCards = flashcardSessions.reduce((sum, s) => sum + s.cardCount, 0);
    const totalFlashcardMinutes = Math.round(
      flashcardSessions.reduce((sum, s) => sum + (s.durationSeconds ?? 0), 0) / 60
    );
    const totalQuizAttempts = quizAttempts.length;
    const avgQuizScore =
      totalQuizAttempts > 0
        ? quizAttempts.reduce((sum, a) => sum + a.score, 0) / totalQuizAttempts
        : 0;

    // Group quiz attempts by source material
    const materialMap = new Map<
      string,
      { materialName: string; scores: number[] }
    >();

    for (const attempt of quizAttempts) {
      const mat = attempt.quiz.sourceMaterial;
      if (!mat) continue;
      if (!materialMap.has(mat.id)) {
        materialMap.set(mat.id, { materialName: mat.fileName, scores: [] });
      }
      materialMap.get(mat.id)!.scores.push(attempt.score);
    }

    const materialPerformance = Array.from(materialMap.entries()).map(
      ([materialId, { materialName, scores }]) => {
        const avgScore = scores.reduce((s, v) => s + v, 0) / scores.length;
        const trend = this.computeMaterialTrend(scores);
        return {
          materialId,
          materialName,
          avgScore,
          attemptCount: scores.length,
          trend,
        };
      }
    );

    // Identify topics needing attention from incorrect answers
    const topicsNeedingAttention = this.analyzeTopics(quizAttempts);

    const content = {
      weekSummary: {
        totalFlashcardSessions,
        totalFlashcardCards,
        totalFlashcardMinutes,
        totalQuizAttempts,
        avgQuizScore,
      },
      materialPerformance,
      topicsNeedingAttention,
    };

    const weeklyOutput: AgentOutput = {
      agentId: this.id,
      userId: input.userId,
      outputType: AgentOutputType.INSIGHT,
      content,
      explainability: {
        reasoning: `Weekly summary: ${totalQuizAttempts} quiz attempts, ${totalFlashcardSessions} flashcard sessions. ${topicsNeedingAttention.length} topics need attention.`,
        dataSourcesUsed: [
          ...flashcardSessions.map((s) => s.id),
          ...quizAttempts.map((a) => a.id),
        ],
        analysisMethod: 'weekly-performance-aggregation',
        keyFactors: {
          totalFlashcardSessions,
          totalFlashcardCards,
          totalFlashcardMinutes,
          totalQuizAttempts,
          avgQuizScore,
          materialsTracked: materialPerformance.length,
        },
      },
      timestamp: new Date(),
      confidence: totalQuizAttempts >= 3 ? 0.8 : totalQuizAttempts >= 1 ? 0.55 : 0.3,
    };

    // Send weekly study email (fire-and-forget)
    void this.emailService.sendWeeklyStudyReport(input.userId, content);

    return weeklyOutput;
  }

  private extractKeywords(texts: string[]): string[] {
    const seen = new Set<string>();
    const keywords: string[] = [];
    for (const text of texts) {
      const words = text.split(/\s+/).filter((w) => w.length > 4);
      for (const word of words) {
        const clean = word.replace(/[^a-zA-Z]/g, '').toLowerCase();
        if (clean && !seen.has(clean)) {
          seen.add(clean);
          keywords.push(clean);
          if (keywords.length >= 3) return keywords;
        }
      }
    }
    return keywords;
  }

  private computeProgressTrend(
    currentAttemptId: string,
    currentScore: number,
    previousAttempts: Array<{ id?: string; score: number; startedAt: Date }>
  ): ProgressTrend {
    // Exclude the current attempt by ID to avoid counting it twice
    const prior = previousAttempts
      .filter((a) => a.id !== currentAttemptId)
      .slice(0, 4);
    if (prior.length === 0) return 'FIRST_ATTEMPT';

    const prevAvg = prior.reduce((s, a) => s + a.score, 0) / prior.length;
    if (currentScore > prevAvg + 5) return 'IMPROVING';
    if (currentScore < prevAvg - 5) return 'DECLINING';
    return 'STABLE';
  }

  private computeMaterialTrend(scores: number[]): MaterialTrend {
    if (scores.length < 2) return 'STABLE';
    const first = scores[scores.length - 1];
    const last = scores[0];
    if (last > first + 5) return 'IMPROVING';
    if (last < first - 5) return 'DECLINING';
    return 'STABLE';
  }

  /**
   * Extract meaningful topics/concepts from question text
   */
  private extractPhrases(text: string): string[] {
    const phrases: string[] = [];

    // Match capitalized multi-word phrases (e.g., "Neural Network", "Gradient Descent")
    const capitalizedPhrases = text.match(/[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+/g) || [];
    phrases.push(...capitalizedPhrases.map(p => p.toLowerCase()));

    // Match technical terms and concepts
    const technicalPattern = /\b(?:algorithm|function|method|process|technique|model|layer|network|optimization|gradient|backpropagation|convergence|activation|convolution|pooling|dropout|regularization|overfitting|underfitting|hyperparameter|epoch|batch|learning rate|loss function|accuracy|precision|recall|f1 score|confusion matrix|cross-validation|feature|classification|regression|clustering|supervised|unsupervised|reinforcement|deep learning|machine learning|artificial intelligence|neural|perceptron|sigmoid|relu|softmax|tanh|lstm|gru|rnn|cnn|gan|autoencoder|transformer|attention|embedding|tokenization|normalization|standardization|encoding|decoding)\b/gi;
    const technicalTerms = text.match(technicalPattern) || [];
    phrases.push(...technicalTerms.map(t => t.toLowerCase()));

    // Remove duplicates
    return Array.from(new Set(phrases));
  }

  /**
   * Analyze quiz attempts to identify specific topics where the student struggles
   */
  private analyzeTopics(
    quizAttempts: Array<{
      quiz: {
        title: string;
        sourceMaterial: { id: string; fileName: string } | null;
      };
      questionAttempts: Array<{
        isCorrect: boolean;
        quizQuestion: { questionText: string };
      }>;
    }>
  ): TopicAnalysis[] {
    const topicMap = new Map<string, {
      incorrect: number;
      total: number;
      quizTitles: Set<string>;
      sourceMaterial?: { id: string; fileName: string };
    }>();

    // Analyze each quiz attempt
    for (const attempt of quizAttempts) {
      for (const qa of attempt.questionAttempts) {
        const topics = this.extractPhrases(qa.quizQuestion.questionText);

        for (const topic of topics) {
          if (!topicMap.has(topic)) {
            topicMap.set(topic, {
              incorrect: 0,
              total: 0,
              quizTitles: new Set(),
              sourceMaterial: attempt.quiz.sourceMaterial || undefined,
            });
          }

          const entry = topicMap.get(topic)!;
          entry.total++;
          if (!qa.isCorrect) entry.incorrect++;
          entry.quizTitles.add(attempt.quiz.title);
        }
      }
    }

    // Convert to TopicAnalysis array
    const analyses: TopicAnalysis[] = [];

    for (const [topic, data] of topicMap.entries()) {
      const errorRate = data.incorrect / data.total;

      // Only include topics with significant error rates (>=50% error and at least 2 incorrect)
      if (errorRate >= 0.5 && data.incorrect >= 2) {
        analyses.push({
          topic,
          incorrectCount: data.incorrect,
          totalAppearances: data.total,
          errorRate,
          quizTitles: Array.from(data.quizTitles),
          sourceMaterial: data.sourceMaterial,
          recommendation: this.generateTopicRecommendation(topic, data),
        });
      }
    }

    // Sort by error rate descending, then by incorrect count descending
    return analyses
      .sort((a, b) => {
        if (b.errorRate !== a.errorRate) return b.errorRate - a.errorRate;
        return b.incorrectCount - a.incorrectCount;
      })
      .slice(0, 5); // Return top 5 topics needing attention
  }

  /**
   * Generate specific recommendation for a topic
   */
  private generateTopicRecommendation(
    topic: string,
    data: { sourceMaterial?: { fileName: string } }
  ): string {
    if (data.sourceMaterial) {
      return `Review ${topic} concepts in ${data.sourceMaterial.fileName}, then retake the quiz to reinforce your understanding.`;
    }
    return `Focus on understanding ${topic} concepts. Review your notes and practice more questions on this topic.`;
  }
}
