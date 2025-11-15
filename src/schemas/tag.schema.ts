import { z } from 'zod';

// Create tag schema
export const createTagSchema = z.object({
  name: z.string()
    .min(1, 'Tag name is required')
    .max(50, 'Tag name must be 50 characters or less')
    .trim(),
  color: z.string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex color (e.g., #FF5733)')
});

// Update tag schema (all fields optional)
export const updateTagSchema = z.object({
  name: z.string()
    .min(1, 'Tag name cannot be empty')
    .max(50, 'Tag name must be 50 characters or less')
    .trim()
    .optional(),
  color: z.string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex color (e.g., #FF5733)')
    .optional()
}).strict();

// Type exports
export type CreateTagInput = z.infer<typeof createTagSchema>;
export type UpdateTagInput = z.infer<typeof updateTagSchema>;
