/**
 * Minimal agents index stub (task 4.1b).
 * This file will be expanded in task 9 when additional agents are added.
 */
import { AgentEventType } from './base/Agent';
import { AgentRegistry } from './core/AgentRegistry';
import { EventBus } from './core/EventBus';
import { OutputStorageService } from './core/OutputStorageService';
import { FocusCoachAgent } from './FocusCoachAgent';

const outputStorage = new OutputStorageService();
const registry = new AgentRegistry();

const focusCoachAgent = new FocusCoachAgent(outputStorage);
registry.registerAgent(focusCoachAgent, [AgentEventType.FOCUS_SESSION_COMPLETED]);

export const eventBus = new EventBus(registry, outputStorage);
