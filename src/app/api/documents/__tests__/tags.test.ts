import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST } from '../route';
import { documentService } from '@/lib/services/document.service';

// Mock the document service
vi.mock('@/lib/services/document.service', () => ({
  documentService: {
    listDocuments: vi.fn(),
    uploadDocument: vi.fn(),
    extractText: vi.fn(),
    getDocument: vi.fn(),
  },
}));

// Mock middleware
vi.mock('@/middleware/auth', () => ({
  requireAuth: (handler: any) => handler,
}));

vi.mock('@/middleware/rateLimit', () => ({
  withRateLimit: (handler: any) => handler,
}));

describe('Document API Routes - Tag Support', () => {
  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
    firebaseUid: 'firebase-uid',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/documents - Tag Filtering', () => {
    it('should filter documents by tags', async () => {
      const mockDocuments = [
        {
          id: 'doc-1',
          fileName: 'biology.pdf',
          fileUrl: 'https://example.com/biology.pdf',
          fileSize: 1024,
          mimeType: 'application/pdf',
          extractedText: null,
          tags: ['biology', 'science'],
          uploadedAt: new Date(),
          processedAt: null,
          userId: mockUser.id,
        },
      ];

      vi.mocked(documentService.listDocuments).mockResolvedValue(mockDocuments);

      const request = new NextRequest('http://localhost:3000/api/documents?tags=biology,science');
      const response = await GET(request, {}, mockUser);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.documents).toHaveLength(1);
      expect(documentService.listDocuments).toHaveBeenCalledWith(mockUser.id, ['biology', 'science']);
    });

    it('should handle single tag filter', async () => {
      const mockDocuments = [
        {
          id: 'doc-1',
          fileName: 'math.pdf',
          fileUrl: 'https://example.com/math.pdf',
          fileSize: 1024,
          mimeType: 'application/pdf',
          extractedText: null,
          tags: ['math'],
          uploadedAt: new Date(),
          processedAt: null,
          userId: mockUser.id,
        },
      ];

      vi.mocked(documentService.listDocuments).mockResolvedValue(mockDocuments);

      const request = new NextRequest('http://localhost:3000/api/documents?tags=math');
      const response = await GET(request, {}, mockUser);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.documents).toHaveLength(1);
      expect(documentService.listDocuments).toHaveBeenCalledWith(mockUser.id, ['math']);
    });

    it('should not filter when no tags provided', async () => {
      const mockDocuments = [
        {
          id: 'doc-1',
          fileName: 'test.pdf',
          fileUrl: 'https://example.com/test.pdf',
          fileSize: 1024,
          mimeType: 'application/pdf',
          extractedText: null,
          tags: [],
          uploadedAt: new Date(),
          processedAt: null,
          userId: mockUser.id,
        },
      ];

      vi.mocked(documentService.listDocuments).mockResolvedValue(mockDocuments);

      const request = new NextRequest('http://localhost:3000/api/documents');
      const response = await GET(request, {}, mockUser);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(documentService.listDocuments).toHaveBeenCalledWith(mockUser.id, undefined);
    });
  });

  describe('POST /api/documents/upload - Tag Assignment', () => {
    it('should upload document with tags from JSON array', async () => {
      const mockDocument = {
        id: 'new-doc-id',
        fileName: 'upload.pdf',
        fileUrl: 'https://example.com/upload.pdf',
        fileSize: 1024,
        mimeType: 'application/pdf',
        extractedText: null,
        tags: ['biology', 'chapter1'],
        uploadedAt: new Date(),
        processedAt: null,
        userId: mockUser.id,
      };

      const mockDocumentWithText = {
        ...mockDocument,
        extractedText: 'Extracted text',
        processedAt: new Date(),
      };

      vi.mocked(documentService.uploadDocument).mockResolvedValue(mockDocument);
      vi.mocked(documentService.extractText).mockResolvedValue('Extracted text');
      vi.mocked(documentService.getDocument).mockResolvedValue(mockDocumentWithText);

      const file = new File(['%PDF-1.4\nTest content'], 'upload.pdf', {
        type: 'application/pdf',
      });

      const formData = new FormData();
      formData.append('file', file);
      formData.append('tags', JSON.stringify(['biology', 'chapter1']));

      const request = new NextRequest('http://localhost:3000/api/documents/upload', {
        method: 'POST',
        body: formData,
      });

      const response = await POST(request, {}, mockUser);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.tags).toEqual(['biology', 'chapter1']);
      expect(documentService.uploadDocument).toHaveBeenCalledWith(
        mockUser.id,
        expect.any(String),
        expect.any(Buffer),
        'application/pdf',
        expect.any(Number),
        ['biology', 'chapter1']
      );
    });

    it('should upload document with tags from comma-separated string', async () => {
      const mockDocument = {
        id: 'new-doc-id',
        fileName: 'upload.pdf',
        fileUrl: 'https://example.com/upload.pdf',
        fileSize: 1024,
        mimeType: 'application/pdf',
        extractedText: null,
        tags: ['math', 'algebra'],
        uploadedAt: new Date(),
        processedAt: null,
        userId: mockUser.id,
      };

      const mockDocumentWithText = {
        ...mockDocument,
        extractedText: 'Extracted text',
        processedAt: new Date(),
      };

      vi.mocked(documentService.uploadDocument).mockResolvedValue(mockDocument);
      vi.mocked(documentService.extractText).mockResolvedValue('Extracted text');
      vi.mocked(documentService.getDocument).mockResolvedValue(mockDocumentWithText);

      const file = new File(['%PDF-1.4\nTest content'], 'upload.pdf', {
        type: 'application/pdf',
      });

      const formData = new FormData();
      formData.append('file', file);
      formData.append('tags', 'math, algebra');

      const request = new NextRequest('http://localhost:3000/api/documents/upload', {
        method: 'POST',
        body: formData,
      });

      const response = await POST(request, {}, mockUser);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.tags).toEqual(['math', 'algebra']);
      expect(documentService.uploadDocument).toHaveBeenCalledWith(
        mockUser.id,
        expect.any(String),
        expect.any(Buffer),
        'application/pdf',
        expect.any(Number),
        ['math', 'algebra']
      );
    });

    it('should upload document without tags when not provided', async () => {
      const mockDocument = {
        id: 'new-doc-id',
        fileName: 'upload.pdf',
        fileUrl: 'https://example.com/upload.pdf',
        fileSize: 1024,
        mimeType: 'application/pdf',
        extractedText: null,
        tags: [],
        uploadedAt: new Date(),
        processedAt: null,
        userId: mockUser.id,
      };

      const mockDocumentWithText = {
        ...mockDocument,
        extractedText: 'Extracted text',
        processedAt: new Date(),
      };

      vi.mocked(documentService.uploadDocument).mockResolvedValue(mockDocument);
      vi.mocked(documentService.extractText).mockResolvedValue('Extracted text');
      vi.mocked(documentService.getDocument).mockResolvedValue(mockDocumentWithText);

      const file = new File(['%PDF-1.4\nTest content'], 'upload.pdf', {
        type: 'application/pdf',
      });

      const formData = new FormData();
      formData.append('file', file);

      const request = new NextRequest('http://localhost:3000/api/documents/upload', {
        method: 'POST',
        body: formData,
      });

      const response = await POST(request, {}, mockUser);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.tags).toEqual([]);
      expect(documentService.uploadDocument).toHaveBeenCalledWith(
        mockUser.id,
        expect.any(String),
        expect.any(Buffer),
        'application/pdf',
        expect.any(Number),
        []
      );
    });
  });
});
