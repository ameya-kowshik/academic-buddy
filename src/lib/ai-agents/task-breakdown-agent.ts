import { GoogleGenerativeAI } from '@google/generative-ai';

interface SubtaskSuggestion {
  title: string;
  estimatedMinutes: number;
  order: number;
}

interface TaskBreakdownResult {
  subtasks: SubtaskSuggestion[];
  reasoning: string;
}

/**
 * AI Agent that breaks down complex tasks into manageable subtasks
 */
export class TaskBreakdownAgent {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor() {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is required for TaskBreakdownAgent');
    }
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
  }

  /**
   * Analyzes a task and suggests subtasks
   */
  async breakdownTask(
    title: string,
    description?: string,
    estimatedMinutes?: number
  ): Promise<TaskBreakdownResult> {
    const prompt = this.buildPrompt(title, description, estimatedMinutes);

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      return this.parseResponse(text);
    } catch (error) {
      console.error('Error in TaskBreakdownAgent:', error);
      throw new Error('Failed to generate task breakdown');
    }
  }

  /**
   * Determines if a task is complex enough to warrant breakdown
   */
  shouldBreakdown(title: string, estimatedMinutes?: number): boolean {
    // Break down if:
    // 1. Estimated time > 90 minutes (more than 1.5 hours)
    // 2. Title contains keywords suggesting complexity
    const complexityKeywords = [
      'study for',
      'prepare for',
      'complete',
      'finish',
      'project',
      'assignment',
      'exam',
      'research',
    ];

    const hasComplexityKeyword = complexityKeywords.some((keyword) =>
      title.toLowerCase().includes(keyword)
    );

    return (estimatedMinutes && estimatedMinutes > 90) || hasComplexityKeyword;
  }

  private buildPrompt(
    title: string,
    description?: string,
    estimatedMinutes?: number
  ): string {
    return `You are a productivity assistant helping students break down complex tasks into manageable subtasks.

Task Title: ${title}
${description ? `Description: ${description}` : ''}
${estimatedMinutes ? `Estimated Time: ${estimatedMinutes} minutes` : ''}

Break this task into 3-5 concrete, actionable subtasks. Each subtask should:
- Be specific and actionable
- Have a realistic time estimate
- Build toward completing the main task
- Be ordered logically

Respond in JSON format:
{
  "subtasks": [
    {
      "title": "Subtask title",
      "estimatedMinutes": 30,
      "order": 1
    }
  ],
  "reasoning": "Brief explanation of the breakdown strategy"
}`;
  }

  private parseResponse(text: string): TaskBreakdownResult {
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/\{[\s\S]*\}/);
      const jsonText = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : text;

      const parsed = JSON.parse(jsonText);

      return {
        subtasks: parsed.subtasks || [],
        reasoning: parsed.reasoning || 'Task breakdown generated',
      };
    } catch (error) {
      console.error('Failed to parse AI response:', text);
      throw new Error('Failed to parse task breakdown response');
    }
  }
}

// Singleton instance
let agentInstance: TaskBreakdownAgent | null = null;

export function getTaskBreakdownAgent(): TaskBreakdownAgent {
  if (!agentInstance) {
    agentInstance = new TaskBreakdownAgent();
  }
  return agentInstance;
}
