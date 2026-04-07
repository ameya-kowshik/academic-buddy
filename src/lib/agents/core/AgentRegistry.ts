import { Agent, AgentEventType } from '../base/Agent';

export class AgentRegistry {
  private readonly registry = new Map<AgentEventType, Agent[]>();

  registerAgent(agent: Agent, eventTypes: AgentEventType[]): void {
    for (const eventType of eventTypes) {
      const existing = this.registry.get(eventType) ?? [];
      existing.push(agent);
      this.registry.set(eventType, existing);
    }
  }

  getAgentsByEvent(eventType: AgentEventType): Agent[] {
    return this.registry.get(eventType) ?? [];
  }
}
