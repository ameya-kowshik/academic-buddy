import { z } from 'zod';

// Enums matching Prisma schema
export const ProjectStatusEnum = z.enum(['PLANNING', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'CANCELLED']);
export const PriorityEnum = z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']);

// Create project schema
export const createProjectSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be 200 characters or less').trim(),
  description: z.string().max(2000, 'Description must be 2000 characters or less').optional().nullable(),
  status: ProjectStatusEnum.default('ACTIVE'),
  priority: PriorityEnum.default('MEDIUM'),
  startDate: z.string().datetime().optional().nullable(),
  dueDate: z.string().datetime().optional().nullable(),
  estimatedHours: z.number().int().positive().max(10000, 'Estimated hours must be 10000 or less').optional().nullable(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex color (e.g., #3b82f6)').default('#3b82f6'),
  icon: z.string().max(10, 'Icon must be 10 characters or less').optional().nullable()
});

// Update project schema (all fields optional)
export const updateProjectSchema = z.object({
  title: z.string().min(1, 'Title cannot be empty').max(200, 'Title must be 200 characters or less').trim().optional(),
  description: z.string().max(2000, 'Description must be 2000 characters or less').optional().nullable(),
  status: ProjectStatusEnum.optional(),
  priority: PriorityEnum.optional(),
  startDate: z.string().datetime().optional().nullable(),
  dueDate: z.string().datetime().optional().nullable(),
  estimatedHours: z.number().int().positive().max(10000, 'Estimated hours must be 10000 or less').optional().nullable(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex color').optional(),
  icon: z.string().max(10, 'Icon must be 10 characters or less').optional().nullable()
}).strict();

// Type exports
export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
