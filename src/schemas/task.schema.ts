import { z } from 'zod';

// Enums matching Prisma schema
export const TaskStatusEnum = z.enum(['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE', 'CANCELLED']);
export const PriorityEnum = z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']);

// Create task schema
export const createTaskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be 200 characters or less').trim(),
  description: z.string().max(2000, 'Description must be 2000 characters or less').optional().nullable(),
  status: TaskStatusEnum.default('TODO'),
  priority: PriorityEnum.default('MEDIUM'),
  estimatedMinutes: z.number().int().positive().max(10000, 'Estimated minutes must be 10000 or less').optional().nullable(),
  dueDate: z.string().datetime().optional().nullable(),
  isRecurring: z.boolean().default(false),
  recurringPattern: z.string().max(100, 'Recurring pattern must be 100 characters or less').optional().nullable(),
  tags: z.array(z.string()).max(10, 'Maximum 10 tags allowed').default([]),
  projectId: z.string().cuid().optional().nullable(),
  parentTaskId: z.string().cuid().optional().nullable()
});

// Update task schema (all fields optional)
export const updateTaskSchema = z.object({
  title: z.string().min(1, 'Title cannot be empty').max(200, 'Title must be 200 characters or less').trim().optional(),
  description: z.string().max(2000, 'Description must be 2000 characters or less').optional().nullable(),
  status: TaskStatusEnum.optional(),
  priority: PriorityEnum.optional(),
  estimatedMinutes: z.number().int().positive().max(10000, 'Estimated minutes must be 10000 or less').optional().nullable(),
  dueDate: z.string().datetime().optional().nullable(),
  isRecurring: z.boolean().optional(),
  recurringPattern: z.string().max(100, 'Recurring pattern must be 100 characters or less').optional().nullable(),
  tags: z.array(z.string()).max(10, 'Maximum 10 tags allowed').optional(),
  projectId: z.string().cuid().optional().nullable(),
  parentTaskId: z.string().cuid().optional().nullable(),
  order: z.number().int().optional()
}).strict();

// Type exports
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
