import { AgentEventType } from './base/Agent';
import { AgentRegistry } from './core/AgentRegistry';
import { EventBus } from './core/EventBus';
import { OutputStorageService } from './core/OutputStorageService';
import { ScheduledTriggerService } from './core/ScheduledTriggerService';
import { FocusCoachAgent } from './FocusCoachAgent';
import { ProductivityAnalystAgent } from './ProductivityAnalystAgent';
import { ReflectionAgent } from './ReflectionAgent';
import { StudyCompanionAgent } from './StudyCompanionAgent';

const outputStorage = new OutputStorageService();
const registry = new AgentRegistry();

const focusCoachAgent = new FocusCoachAgent(outputStorage);
registry.registerAgent(focusCoachAgent, [AgentEventType.FOCUS_SESSION_COMPLETED]);

const productivityAnalystAgent = new ProductivityAnalystAgent(outputStorage);
registry.registerAgent(productivityAnalystAgent, [AgentEventType.WEEKLY_TRIGGER]);

const studyCompanionAgent = new StudyCompanionAgent(outputStorage);
registry.registerAgent(studyCompanionAgent, [
  AgentEventType.QUIZ_COMPLETED,
  AgentEventType.WEEKLY_TRIGGER,
]);

const reflectionAgent = new ReflectionAgent(outputStorage);
registry.registerAgent(reflectionAgent, [
  AgentEventType.WEEKLY_TRIGGER,
  AgentEventType.MONTHLY_TRIGGER,
]);

export const eventBus = new EventBus(registry, outputStorage);
export const outputStorageService = outputStorage;
export const scheduledTriggerService = new ScheduledTriggerService(eventBus);
