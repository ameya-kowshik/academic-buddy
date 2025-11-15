import { z } from 'zod';

// Update user profile schema
export const updateUserProfileSchema = z.object({
  name: z.string()
    .min(1, 'Name cannot be empty')
    .max(100, 'Name must be 100 characters or less')
    .trim()
    .optional()
    .nullable(),
  email: z.string()
    .email('Invalid email address')
    .max(255, 'Email must be 255 characters or less')
    .optional(),
  profilePic: z.string()
    .url('Profile picture must be a valid URL')
    .max(500, 'Profile picture URL must be 500 characters or less')
    .optional()
    .nullable()
}).strict();

// Type exports
export type UpdateUserProfileInput = z.infer<typeof updateUserProfileSchema>;
