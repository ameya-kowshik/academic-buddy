import Groq from 'groq-sdk';
import { QuizAttempt } from '@prisma/client';

/**
 * Generated flashcard structure from AI
 */
export interface GeneratedFlashcard {
  title: string;
  question: string;
  answer: string;
  difficulty: number;
}

/**
 * Generated quiz structure from AI
 */
export interface GeneratedQuiz {
  title: string;
  description: string;
  difficulty: number;
  questions: GeneratedQuestion[];
}

/**
 * Generated quiz question structure
 */
export interface GeneratedQuestion {
  questionText: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  order: number;
}

/**
 * Weak area analysis result from AI
 */
export interface WeakAreaAnalysis {
  weakTopics: string[];
  weakDifficulties: number[];
  recommendations: string[];
}

/**
 * Service for AI-powered study material generation and analysis
 * Uses Groq API for fast, efficient content generation
 */
export class AIService {
  private groq: Groq | null = null;
  private model = 'llama-3.3-70b-versatile'; // Fast and capable model

  constructor() {
    const apiKey = process.env.GROQ_API_KEY;
    if (apiKey) {
      this.groq = new Groq({ apiKey });
    }
  }

  /**
   * Check if AI service is available
   */
  private isAvailable(): boolean {
    return this.groq !== null;
  }

  /**
   * Generate flashcards from document text using AI
   * @param documentText - Extracted text from document
   * @param count - Number of flashcards to generate
   * @returns Array of generated flashcards
   * @throws Error if AI service unavailable or generation fails
   */
  async generateFlashcards(documentText: string, count: number): Promise<GeneratedFlashcard[]> {
    if (!this.isAvailable()) {
      throw new Error('AI service is not configured. Please set GROQ_API_KEY environment variable.');
    }

    if (!documentText || documentText.trim().length === 0) {
      throw new Error('Document text is empty');
    }

    if (count < 1 || count > 50) {
      throw new Error('Count must be between 1 and 50');
    }

    try {
      const prompt = `You are an educational content creator. Generate ${count} flashcards from the following text.

Each flashcard should:
- Have a clear, concise title (max 50 characters)
- Have a question that tests understanding
- Have a comprehensive answer
- Have a difficulty level from 1 (easiest) to 5 (hardest)

Text to analyze:
${documentText.substring(0, 10000)}

Return ONLY a valid JSON array with this exact structure:
[
  {
    "title": "Flashcard title",
    "question": "Question text?",
    "answer": "Answer text",
    "difficulty": 3
  }
]

Do not include any markdown formatting, code blocks, or additional text. Return only the JSON array.`;

      const completion = await this.groq!.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: this.model,
        temperature: 0.7,
        max_tokens: 4096,
      });

      const text = completion.choices[0]?.message?.content || '';

      // Parse JSON response
      const flashcards = this.parseJSONResponse<GeneratedFlashcard[]>(text);

      // Validate flashcards
      if (!Array.isArray(flashcards)) {
        throw new Error('Invalid response format: expected array');
      }

      // Validate each flashcard
      for (const flashcard of flashcards) {
        if (!flashcard.title || !flashcard.question || !flashcard.answer) {
          throw new Error('Invalid flashcard: missing required fields');
        }
        if (flashcard.difficulty < 1 || flashcard.difficulty > 5) {
          throw new Error('Invalid flashcard: difficulty must be between 1 and 5');
        }
      }

      return flashcards.slice(0, count);
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to generate flashcards: ${error.message}`);
      }
      throw new Error('Failed to generate flashcards: Unknown error');
    }
  }

  /**
   * Generate a quiz from document text using AI
   * @param documentText - Extracted text from document
   * @param questionCount - Number of questions to generate
   * @returns Generated quiz with questions
   * @throws Error if AI service unavailable or generation fails
   */
  async generateQuiz(documentText: string, questionCount: number, userPrompt?: string): Promise<GeneratedQuiz> {
    if (!this.isAvailable()) {
      throw new Error('AI service is not configured. Please set GROQ_API_KEY environment variable.');
    }

    if (!documentText || documentText.trim().length === 0) {
      throw new Error('Document text is empty');
    }

    if (questionCount < 1 || questionCount > 50) {
      throw new Error('Question count must be between 1 and 50');
    }

    try {
      const prompt = `You are an educational content creator. Generate a quiz with ${questionCount} multiple-choice questions from the following text.

The quiz should:
- Have a descriptive title
- Have a brief description
- Have a difficulty level from 1 (easiest) to 5 (hardest)
- Each question should have 4 options
- Each question should have exactly one correct answer
- Each question should have an explanation for the correct answer
${userPrompt ? `\nAdditional instructions from the user:\n${userPrompt}\n` : ''}
Text to analyze:
${documentText.substring(0, 10000)}

Return ONLY a valid JSON object with this exact structure:
{
  "title": "Quiz title",
  "description": "Quiz description",
  "difficulty": 3,
  "questions": [
    {
      "questionText": "Question text?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "Option A",
      "explanation": "Explanation text",
      "order": 1
    }
  ]
}

Do not include any markdown formatting, code blocks, or additional text. Return only the JSON object.`;

      const completion = await this.groq!.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: this.model,
        temperature: 0.7,
        max_tokens: 4096,
      });

      const text = completion.choices[0]?.message?.content || '';

      // Parse JSON response
      const quiz = this.parseJSONResponse<GeneratedQuiz>(text);

      // Validate quiz structure
      if (!quiz.title || !quiz.description || !quiz.questions) {
        throw new Error('Invalid response format: missing required fields');
      }

      if (quiz.difficulty < 1 || quiz.difficulty > 5) {
        throw new Error('Invalid quiz: difficulty must be between 1 and 5');
      }

      if (!Array.isArray(quiz.questions)) {
        throw new Error('Invalid response format: questions must be an array');
      }

      // Validate each question
      for (const question of quiz.questions) {
        if (!question.questionText || !question.options || !question.correctAnswer || !question.explanation) {
          throw new Error('Invalid question: missing required fields');
        }
        if (!Array.isArray(question.options) || question.options.length < 2) {
          throw new Error('Invalid question: must have at least 2 options');
        }
        if (!question.options.includes(question.correctAnswer)) {
          throw new Error('Invalid question: correct answer must be one of the options');
        }
      }

      // Ensure questions have correct order
      quiz.questions = quiz.questions.slice(0, questionCount).map((q, index) => ({
        ...q,
        order: index + 1,
      }));

      return quiz;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to generate quiz: ${error.message}`);
      }
      throw new Error('Failed to generate quiz: Unknown error');
    }
  }

  /**
   * Analyze quiz attempt history to identify weak areas
   * @param attemptHistory - Array of quiz attempts with quiz metadata
   * @returns Weak area analysis with recommendations
   * @throws Error if AI service unavailable or analysis fails
   */
  async analyzeWeakAreas(
    attemptHistory: Array<QuizAttempt & { quiz: { grouping: string | null; difficulty: number } }>
  ): Promise<WeakAreaAnalysis> {
    if (!this.isAvailable()) {
      throw new Error('AI service is not configured. Please set GROQ_API_KEY environment variable.');
    }

    if (!attemptHistory || attemptHistory.length === 0) {
      throw new Error('No attempt history provided');
    }

    try {
      // Prepare attempt data for analysis
      const attemptData = attemptHistory.map((attempt) => ({
        score: attempt.score,
        difficulty: attempt.quiz.difficulty,
        grouping: attempt.quiz.grouping,
        totalQuestions: attempt.totalQuestions,
        correctAnswers: attempt.correctAnswers,
      }));

      const prompt = `You are an educational performance analyst. Analyze the following quiz attempt history and identify weak areas.

Attempt History:
${JSON.stringify(attemptData, null, 2)}

Identify:
1. Weak topics (groupings with average score below 70%)
2. Weak difficulty levels (difficulty levels with average score below 70%)
3. Specific recommendations for improvement

Return ONLY a valid JSON object with this exact structure:
{
  "weakTopics": ["topic1", "topic2"],
  "weakDifficulties": [3, 4],
  "recommendations": [
    "Recommendation 1",
    "Recommendation 2",
    "Recommendation 3"
  ]
}

Do not include any markdown formatting, code blocks, or additional text. Return only the JSON object.`;

      const completion = await this.groq!.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: this.model,
        temperature: 0.7,
        max_tokens: 2048,
      });

      const text = completion.choices[0]?.message?.content || '';

      // Parse JSON response
      const analysis = this.parseJSONResponse<WeakAreaAnalysis>(text);

      // Validate analysis structure
      if (!analysis.weakTopics || !analysis.weakDifficulties || !analysis.recommendations) {
        throw new Error('Invalid response format: missing required fields');
      }

      if (!Array.isArray(analysis.weakTopics) || !Array.isArray(analysis.weakDifficulties) || !Array.isArray(analysis.recommendations)) {
        throw new Error('Invalid response format: fields must be arrays');
      }

      return analysis;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to analyze weak areas: ${error.message}`);
      }
      throw new Error('Failed to analyze weak areas: Unknown error');
    }
  }

  /**
   * Parse JSON response from AI, handling markdown code blocks
   * @param text - Raw text response from AI
   * @returns Parsed JSON object
   */
  private parseJSONResponse<T>(text: string): T {
    // Remove markdown code blocks if present
    let cleanText = text.trim();
    
    // Remove ```json and ``` markers
    if (cleanText.startsWith('```json')) {
      cleanText = cleanText.substring(7);
    } else if (cleanText.startsWith('```')) {
      cleanText = cleanText.substring(3);
    }
    
    if (cleanText.endsWith('```')) {
      cleanText = cleanText.substring(0, cleanText.length - 3);
    }
    
    cleanText = cleanText.trim();

    try {
      return JSON.parse(cleanText) as T;
    } catch (error) {
      throw new Error(`Failed to parse JSON response: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// Export singleton instance
export const aiService = new AIService();
