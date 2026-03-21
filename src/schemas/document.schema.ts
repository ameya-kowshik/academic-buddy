import { z } from 'zod';

/**
 * Schema for document upload validation
 */
export const documentUploadSchema = z.object({
  fileName: z.string().min(1, 'File name is required'),
  fileSize: z.number().positive('File size must be positive').max(50 * 1024 * 1024, 'File size must be less than 50MB'),
  mimeType: z.string().refine((val) => val === 'application/pdf', {
    message: 'Only PDF files are supported',
  }),
});

/**
 * Schema for document metadata
 */
export const documentMetadataSchema = z.object({
  id: z.string(),
  fileName: z.string(),
  fileUrl: z.string().url(),
  fileSize: z.number(),
  mimeType: z.string(),
  extractedText: z.string().nullable(),
  tags: z.array(z.string()).default([]),
  uploadedAt: z.date(),
  processedAt: z.date().nullable(),
  userId: z.string(),
});

/**
 * Schema for updating document tags
 */
export const updateDocumentTagsSchema = z.object({
  tags: z.array(z.string()),
});

export type DocumentUpload = z.infer<typeof documentUploadSchema>;
export type DocumentMetadata = z.infer<typeof documentMetadataSchema>;
export type UpdateDocumentTags = z.infer<typeof updateDocumentTagsSchema>;
