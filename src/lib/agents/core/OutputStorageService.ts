import { prisma } from '@/lib/prisma';
import { AgentOutput } from '../base/Agent';

// Serialize to plain JSON so Prisma's InputJsonValue constraint is satisfied
function toJson(value: unknown) {
  return JSON.parse(JSON.stringify(value));
}

export class OutputStorageService {
  async storeOutput(output: AgentOutput, executionId: string): Promise<string> {
    const record = await prisma.agentOutput.create({
      data: {
        agentId: output.agentId,
        userId: output.userId,
        executionId,
        outputType: output.outputType,
        content: toJson(output.content),
        explainability: toJson(output.explainability),
        confidence: output.confidence ?? null,
      },
    });
    return record.id;
  }

  async getOutputsByUser(
    userId: string,
    filters?: { agentId?: string; limit?: number }
  ) {
    return prisma.agentOutput.findMany({
      where: {
        userId,
        dismissed: false,
        ...(filters?.agentId ? { agentId: filters.agentId } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: filters?.limit ?? 10,
    });
  }

  async getOutputById(outputId: string, userId: string) {
    return prisma.agentOutput.findFirst({
      where: { id: outputId, userId },
    });
  }

  async markInteraction(
    outputId: string,
    userId: string,
    type: 'viewed' | 'dismissed'
  ): Promise<void> {
    const now = new Date();
    await prisma.agentOutput.updateMany({
      where: { id: outputId, userId },
      data:
        type === 'viewed'
          ? { viewed: true, viewedAt: now }
          : { dismissed: true, dismissedAt: now },
    });
  }
}
