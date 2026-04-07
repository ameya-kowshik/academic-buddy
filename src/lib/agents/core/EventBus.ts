import { prisma } from '@/lib/prisma';
import { AgentEvent } from '../base/Agent';
import { AgentRegistry } from './AgentRegistry';
import { OutputStorageService } from './OutputStorageService';

const DEDUP_WINDOW_MS = 60 * 1000; // 60 seconds

export class EventBus {
  constructor(
    private readonly registry: AgentRegistry,
    private readonly outputStorage: OutputStorageService
  ) {}

  async publishEvent(event: AgentEvent): Promise<void> {
    const agents = this.registry.getAgentsByEvent(event.type);

    for (const agent of agents) {
      // Run each agent independently — failures must not propagate
      this.runAgent(agent, event).catch(() => {
        // Swallowed: execution record already marked FAILED inside runAgent
      });
    }
  }

  private async runAgent(
    agent: { id: string; name: string; prepareInput: Function; execute: Function; validateOutput: Function },
    event: AgentEvent
  ): Promise<void> {
    // Deduplication check
    const windowStart = new Date(Date.now() - DEDUP_WINDOW_MS);
    const recent = await prisma.agentExecution.findFirst({
      where: {
        agentId: agent.id,
        userId: event.userId,
        eventType: event.type,
        startedAt: { gte: windowStart },
      },
    });

    if (recent) {
      return; // Skip duplicate within 60-second window
    }

    // Create execution record
    const execution = await prisma.agentExecution.create({
      data: {
        agentId: agent.id,
        userId: event.userId,
        eventType: event.type,
        status: 'RUNNING',
      },
    });

    try {
      const input = await agent.prepareInput(event);
      const output = await agent.execute(input);

      if (agent.validateOutput(output)) {
        await this.outputStorage.storeOutput(output, execution.id);
      }

      await prisma.agentExecution.update({
        where: { id: execution.id },
        data: { status: 'COMPLETED', completedAt: new Date() },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[EventBus] Agent "${agent.id}" failed for user ${event.userId}:`, message);

      await prisma.agentExecution.update({
        where: { id: execution.id },
        data: { status: 'FAILED', completedAt: new Date(), error: message },
      });
    }
  }
}
