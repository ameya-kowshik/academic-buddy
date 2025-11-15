import { z } from 'zod';

// Session type enum
export const SessionTypeEnum = z.enum(['POMODORO', 'STOPWATCH']);

// Create focus session schema
export const createFocusSessionSchema = z.object({
  duration: z.number()
    .int('Duration must be an integer')
    .positive('Duration must be greater than 0')
    .max(180, 'Duration cannot exceed 180 minutes (3 hours)'),
  sessionType: SessionTypeEnum.default('POMODORO'),
  focusScore: z.number()
    .int('Focus score must be an integer')
    .min(1, 'Focus score must be at least 1')
    .max(10, 'Focus score must be at most 10')
    .optional()
    .nullable(),
  notes: z.string().max(2000, 'Notes must be 2000 characters or less').optional().nullable(),
  startedAt: z.string().datetime().optional(),
  completedAt: z.string().datetime().optional().nullable(),
  projectId: z.string().cuid().optional().nullable(),
  taskId: z.string().cuid().optional().nullable(),
  tagId: z.string().cuid().optional().nullable()
});

// Update focus session schema (all fields optional)
export const updateFocusSessionSchema = z.object({
  duration: z.number()
    .int('Duration must be an integer')
    .positive('Duration must be greater than 0')
    .max(180, 'Duration cannot exceed 180 minutes (3 hours)')
    .optional(),
  sessionType: SessionTypeEnum.optional(),
  focusScore: z.number()
    .int('Focus score must be an integer')
    .min(1, 'Focus score must be at least 1')
    .max(10, 'Focus score must be at most 10')
    .optional()
    .nullable(),
  notes: z.string().max(2000, 'Notes must be 2000 characters or less').optional().nullable(),
  completedAt: z.string().datetime().optional().nullable(),
  projectId: z.string().cuid().optional().nullable(),
  taskId: z.string().cuid().optional().nullable(),
  tagId: z.string().cuid().optional().nullable()
}).strict();

// Type exports
export type CreateFocusSessionInput = z.infer<typeof createFocusSessionSchema>;
export type UpdateFocusSessionInput = z.infer<typeof updateFocusSessionSchema>;
