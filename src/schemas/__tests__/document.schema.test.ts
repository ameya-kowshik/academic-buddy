import { describe, it, expect } from 'vitest';
import { documentUploadSchema } from '../document.schema';

describe('Document Schema', () => {
  describe('documentUploadSchema', () => {
    it('should validate correct document upload data', () => {
      const validData = {
        fileName: 'test.pdf',
        fileSize: 1024 * 1024, // 1MB
        mimeType: 'application/pdf',
      };

      const result = documentUploadSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject empty file name', () => {
      const invalidData = {
        fileName: '',
        fileSize: 1024,
        mimeType: 'application/pdf',
      };

      const result = documentUploadSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('File name is required');
      }
    });

    it('should reject negative file size', () => {
      const invalidData = {
        fileName: 'test.pdf',
        fileSize: -100,
        mimeType: 'application/pdf',
      };

      const result = documentUploadSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('File size must be positive');
      }
    });

    it('should reject file size larger than 50MB', () => {
      const invalidData = {
        fileName: 'test.pdf',
        fileSize: 51 * 1024 * 1024,
        mimeType: 'application/pdf',
      };

      const result = documentUploadSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('File size must be less than 50MB');
      }
    });

    it('should reject non-PDF MIME types', () => {
      const invalidData = {
        fileName: 'test.txt',
        fileSize: 1024,
        mimeType: 'text/plain',
      };

      const result = documentUploadSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Only PDF files are supported');
      }
    });

    it('should accept file at maximum size limit', () => {
      const validData = {
        fileName: 'large.pdf',
        fileSize: 50 * 1024 * 1024, // Exactly 50MB
        mimeType: 'application/pdf',
      };

      const result = documentUploadSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });
});
