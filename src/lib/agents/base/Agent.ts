export enum AgentEventType {
  FOCUS_SESSION_COMPLETED = 'FOCUS_SESSION_COMPLETED',
  QUIZ_COMPLETED = 'QUIZ_COMPLETED',
  WEEKLY_TRIGGER = 'WEEKLY_TRIGGER',
  MONTHLY_TRIGGER = 'MONTHLY_TRIGGER',
}

export enum AgentOutputType {
  SUGGESTION = 'SUGGESTION',
  INSIGHT = 'INSIGHT',
  RECOMMENDATION = 'RECOMMENDATION',
  REFLECTION = 'REFLECTION',
  WARNING = 'WARNING',
}

export interface AgentEvent {
  type: AgentEventType;
  userId: string;
  timestamp: Date;
  payload: Record<string, unknown>;
}

export interface AgentInput<T = unknown> {
  userId: string;
  event: AgentEvent;
  context: T;
}

export interface AgentOutput {
  agentId: string;
  userId: string;
  outputType: AgentOutputType;
  content: Record<string, unknown>;
  explainability: {
    reasoning: string;
    dataSourcesUsed: string[];
    analysisMethod: string;
    keyFactors: Record<string, unknown>;
  };
  timestamp: Date;
  confidence?: number;
}

export abstract class Agent {
  abstract readonly id: string;
  abstract readonly name: string;

  abstract prepareInput(event: AgentEvent): Promise<AgentInput>;
  abstract execute(input: AgentInput): Promise<AgentOutput>;

  validateOutput(output: AgentOutput): boolean {
    return !!(
      output.agentId &&
      output.userId &&
      output.content &&
      output.explainability
    );
  }
}
