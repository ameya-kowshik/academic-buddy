import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, DELETE } from '../route';
import { documentService } from '@/lib/services/document.service';

// Mock the document service
vi.mock('@/lib/services/document.service', () => ({
  documentService: {
    getDocument: vi.fn(),
    deleteDocument: vi.fn(),
  },
}));

// Mock middleware
vi.mock('@/middleware/auth', () => ({
  requireAuth: (handler: any) => handler,
}));

vi.mock('@/middleware/rateLimit', () => ({
  withRateLimit: (handler: any) => handler,
}));

describe('Document [id] API Routes', () => {
  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
    firebaseUid: 'firebase-uid',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockDocument = {
    id: 'doc-123',
    fileName: 'test.pdf',
    fileUrl: 'https://example.com/test.pdf',
    fileSize: 1024,
    mimeType: 'application/pdf',
    extractedText: 'Sample extracted text',
    uploadedAt: new Date(),
    processedAt: new Date(),
    userId: mockUser.id,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/documents/[id]', () => {
    it('should return a document by id', async () => {
      vi.mocked(documentService.getDocument).mockResolvedValue(mockDocument);

      const request = new NextRequest('http://localhost:3000/api/documents/doc-123');
      const context = { params: { id: 'doc-123' } };
      const response = await GET(request, context, mockUser);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.id).toBe('doc-123');
      expect(data.fileName).toBe('test.pdf');
      expect(documentService.getDocument).toHaveBeenCalledWith(mockUser.id, 'doc-123');
    });

    it('should return 404 when document not found', async () => {
      vi.mocked(documentService.getDocument).mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/documents/nonexistent');
      const context = { params: { id: 'nonexistent' } };
      const response = await GET(request, context, mockUser);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Document not found');
    });

    it('should handle errors gracefully', async () => {
      vi.mocked(documentService.getDocument).mockRejectedValue(
        new Error('Database error')
      );

      const request = new NextRequest('http://localhost:3000/api/documents/doc-123');
      const context = { params: { id: 'doc-123' } };
      const response = await GET(request, context, mockUser);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to fetch document');
      expect(data.details).toBe('Database error');
    });
  });

  describe('DELETE /api/documents/[id]', () => {
    it('should delete a document successfully', async () => {
      vi.mocked(documentService.deleteDocument).mockResolvedValue(undefined);

      const request = new NextRequest('http://localhost:3000/api/documents/doc-123', {
        method: 'DELETE',
      });
      const context = { params: { id: 'doc-123' } };
      const response = await DELETE(request, context, mockUser);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe('Document deleted successfully');
      expect(documentService.deleteDocument).toHaveBeenCalledWith(mockUser.id, 'doc-123');
    });

    it('should return 404 when document not found', async () => {
      vi.mocked(documentService.deleteDocument).mockRejectedValue(
        new Error('Document not found')
      );

      const request = new NextRequest('http://localhost:3000/api/documents/nonexistent', {
        method: 'DELETE',
      });
      const context = { params: { id: 'nonexistent' } };
      const response = await DELETE(request, context, mockUser);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Document not found');
    });

    it('should handle other errors gracefully', async () => {
      vi.mocked(documentService.deleteDocument).mockRejectedValue(
        new Error('Storage deletion failed')
      );

      const request = new NextRequest('http://localhost:3000/api/documents/doc-123', {
        method: 'DELETE',
      });
      const context = { params: { id: 'doc-123' } };
      const response = await DELETE(request, context, mockUser);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to delete document');
      expect(data.details).toBe('Storage deletion failed');
    });
  });
});
