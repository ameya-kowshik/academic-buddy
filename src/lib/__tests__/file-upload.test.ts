import { describe, it, expect } from 'vitest';
import { validatePdfFile, validatePdfBuffer } from '../file-upload';

describe('File Upload Utilities', () => {
  describe('validatePdfFile', () => {
    it('should accept valid PDF files', () => {
      const validPdf = new File(['%PDF-1.4 content'], 'test.pdf', {
        type: 'application/pdf',
      });

      const result = validatePdfFile(validPdf);
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject non-PDF MIME types', () => {
      const invalidFile = new File(['content'], 'test.txt', {
        type: 'text/plain',
      });

      const result = validatePdfFile(invalidFile);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Only PDF files are supported');
    });

    it('should reject files larger than 50MB', () => {
      // Create a mock file with size > 50MB
      const largeFile = new File(['content'], 'large.pdf', {
        type: 'application/pdf',
      });
      
      // Mock the size property
      Object.defineProperty(largeFile, 'size', {
        value: 51 * 1024 * 1024, // 51MB
        writable: false,
      });

      const result = validatePdfFile(largeFile);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('File size must be less than 50MB');
    });

    it('should accept files at the size limit', () => {
      const maxSizeFile = new File(['content'], 'max.pdf', {
        type: 'application/pdf',
      });
      
      Object.defineProperty(maxSizeFile, 'size', {
        value: 50 * 1024 * 1024, // Exactly 50MB
        writable: false,
      });

      const result = validatePdfFile(maxSizeFile);
      expect(result.valid).toBe(true);
    });
  });

  describe('validatePdfBuffer', () => {
    it('should accept valid PDF buffers with correct magic number', () => {
      const pdfBuffer = Buffer.from('%PDF-1.4\nContent here');
      const result = validatePdfBuffer(pdfBuffer, 'application/pdf', pdfBuffer.length);

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject buffers with incorrect MIME type', () => {
      const buffer = Buffer.from('%PDF-1.4\nContent');
      const result = validatePdfBuffer(buffer, 'text/plain', buffer.length);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Only PDF files are supported');
    });

    it('should reject buffers without PDF magic number', () => {
      const invalidBuffer = Buffer.from('Not a PDF file');
      const result = validatePdfBuffer(invalidBuffer, 'application/pdf', invalidBuffer.length);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('Invalid PDF file format');
    });

    it('should reject buffers larger than 50MB', () => {
      const pdfBuffer = Buffer.from('%PDF-1.4\nContent');
      const result = validatePdfBuffer(pdfBuffer, 'application/pdf', 51 * 1024 * 1024);

      expect(result.valid).toBe(false);
      expect(result.error).toBe('File size must be less than 50MB');
    });

    it('should accept buffers at the size limit', () => {
      const pdfBuffer = Buffer.from('%PDF-1.4\nContent');
      const result = validatePdfBuffer(pdfBuffer, 'application/pdf', 50 * 1024 * 1024);

      expect(result.valid).toBe(true);
    });
  });
});
