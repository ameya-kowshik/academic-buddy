import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DocumentService } from '../document.service';
import { prisma } from '@/lib/prisma';
import * as fileUploadServer from '@/lib/file-upload-server';

// Mock pdf-parse with hoisted function
const mockPdfParse = vi.hoisted(() => vi.fn());

// Mock dependencies
vi.mock('@/lib/prisma', () => ({
  prisma: {
    sourceMaterial: {
      create: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

vi.mock('@/lib/file-upload-server', () => ({
  uploadFileToStorage: vi.fn(),
  deleteFileFromStorage: vi.fn(),
}));

vi.mock('pdf-parse', () => ({
  default: mockPdfParse,
}));

describe('DocumentService', () => {
  let documentService: DocumentService;
  const mockUserId = 'user-123';
  const mockDocumentId = 'doc-123';

  beforeEach(() => {
    documentService = new DocumentService();
    vi.clearAllMocks();
  });

  describe('uploadDocument', () => {
    it('should upload file and create SourceMaterial record', async () => {
      const mockFileName = 'test.pdf';
      const mockBuffer = Buffer.from('test');
      const mockMimeType = 'application/pdf';
      const mockFileSize = 1024;
      const mockFileUrl = 'https://storage.example.com/test.pdf';
      const mockSourceMaterial = {
        id: mockDocumentId,
        fileName: mockFileName,
        fileUrl: mockFileUrl,
        fileSize: mockFileSize,
        mimeType: mockMimeType,
        extractedText: null,
        uploadedAt: new Date(),
        processedAt: null,
        userId: mockUserId,
      };

      vi.mocked(fileUploadServer.uploadFileToStorage).mockResolvedValue(mockFileUrl);
      vi.mocked(prisma.sourceMaterial.create).mockResolvedValue(mockSourceMaterial);

      const result = await documentService.uploadDocument(
        mockUserId,
        mockFileName,
        mockBuffer,
        mockMimeType,
        mockFileSize
      );

      expect(fileUploadServer.uploadFileToStorage).toHaveBeenCalledWith(
        mockUserId,
        mockFileName,
        mockBuffer,
        mockMimeType
      );
      expect(prisma.sourceMaterial.create).toHaveBeenCalledWith({
        data: {
          fileName: mockFileName,
          fileUrl: mockFileUrl,
          fileSize: mockFileSize,
          mimeType: mockMimeType,
          userId: mockUserId,
          tags: [],
        },
      });
      expect(result).toEqual(mockSourceMaterial);
    });

    it('should throw error if file upload fails', async () => {
      vi.mocked(fileUploadServer.uploadFileToStorage).mockRejectedValue(
        new Error('Upload failed')
      );

      await expect(
        documentService.uploadDocument(
          mockUserId,
          'test.pdf',
          Buffer.from('test'),
          'application/pdf',
          1024
        )
      ).rejects.toThrow('Upload failed');
    });
  });

  describe('getDocument', () => {
    it('should retrieve document with ownership check', async () => {
      const mockDocument = {
        id: mockDocumentId,
        fileName: 'test.pdf',
        fileUrl: 'https://storage.example.com/test.pdf',
        fileSize: 1024,
        mimeType: 'application/pdf',
        extractedText: null,
        uploadedAt: new Date(),
        processedAt: null,
        userId: mockUserId,
      };

      vi.mocked(prisma.sourceMaterial.findFirst).mockResolvedValue(mockDocument);

      const result = await documentService.getDocument(mockUserId, mockDocumentId);

      expect(prisma.sourceMaterial.findFirst).toHaveBeenCalledWith({
        where: {
          id: mockDocumentId,
          userId: mockUserId,
        },
      });
      expect(result).toEqual(mockDocument);
    });

    it('should return null if document not found', async () => {
      vi.mocked(prisma.sourceMaterial.findFirst).mockResolvedValue(null);

      const result = await documentService.getDocument(mockUserId, 'non-existent');

      expect(result).toBeNull();
    });

    it('should return null if user does not own document', async () => {
      vi.mocked(prisma.sourceMaterial.findFirst).mockResolvedValue(null);

      const result = await documentService.getDocument('other-user', mockDocumentId);

      expect(result).toBeNull();
    });
  });

  describe('listDocuments', () => {
    it('should retrieve all user documents ordered by upload date', async () => {
      const mockDocuments = [
        {
          id: 'doc-1',
          fileName: 'test1.pdf',
          fileUrl: 'https://storage.example.com/test1.pdf',
          fileSize: 1024,
          mimeType: 'application/pdf',
          extractedText: null,
          uploadedAt: new Date('2024-01-02'),
          processedAt: null,
          userId: mockUserId,
        },
        {
          id: 'doc-2',
          fileName: 'test2.pdf',
          fileUrl: 'https://storage.example.com/test2.pdf',
          fileSize: 2048,
          mimeType: 'application/pdf',
          extractedText: 'Some text',
          uploadedAt: new Date('2024-01-01'),
          processedAt: new Date('2024-01-01'),
          userId: mockUserId,
        },
      ];

      vi.mocked(prisma.sourceMaterial.findMany).mockResolvedValue(mockDocuments);

      const result = await documentService.listDocuments(mockUserId);

      expect(prisma.sourceMaterial.findMany).toHaveBeenCalledWith({
        where: {
          userId: mockUserId,
        },
        orderBy: {
          uploadedAt: 'desc',
        },
      });
      expect(result).toEqual(mockDocuments);
    });

    it('should return empty array if user has no documents', async () => {
      vi.mocked(prisma.sourceMaterial.findMany).mockResolvedValue([]);

      const result = await documentService.listDocuments(mockUserId);

      expect(result).toEqual([]);
    });
  });

  describe('extractText', () => {
    it('should extract text from PDF and update SourceMaterial', async () => {
      const mockDocument = {
        id: mockDocumentId,
        fileName: 'test.pdf',
        fileUrl: 'https://storage.example.com/test.pdf',
        fileSize: 1024,
        mimeType: 'application/pdf',
        extractedText: null,
        uploadedAt: new Date(),
        processedAt: null,
        userId: mockUserId,
      };

      const mockExtractedText = 'This is extracted text from the PDF';
      const mockPdfBuffer = Buffer.from('mock pdf content');

      // Mock prisma.sourceMaterial.findUnique
      vi.mocked(prisma.sourceMaterial.findUnique).mockResolvedValue(mockDocument);

      // Mock prisma.sourceMaterial.update
      vi.mocked(prisma.sourceMaterial.update).mockResolvedValue({
        ...mockDocument,
        extractedText: mockExtractedText,
        processedAt: new Date(),
      });

      // Mock fetch
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        arrayBuffer: async () => mockPdfBuffer.buffer,
      });

      // Mock pdf-parse
      mockPdfParse.mockResolvedValue({ text: mockExtractedText });

      const result = await documentService.extractText(mockDocumentId);

      expect(prisma.sourceMaterial.findUnique).toHaveBeenCalledWith({
        where: { id: mockDocumentId },
      });
      expect(global.fetch).toHaveBeenCalledWith(mockDocument.fileUrl);
      expect(prisma.sourceMaterial.update).toHaveBeenCalledWith({
        where: { id: mockDocumentId },
        data: {
          extractedText: mockExtractedText,
          processedAt: expect.any(Date),
        },
      });
      expect(result).toBe(mockExtractedText);
    });

    it('should throw error if document not found', async () => {
      vi.mocked(prisma.sourceMaterial.findUnique).mockResolvedValue(null);

      await expect(documentService.extractText('non-existent')).rejects.toThrow(
        'Document not found'
      );
    });

    it('should handle extraction errors gracefully and mark as processed', async () => {
      const mockDocument = {
        id: mockDocumentId,
        fileName: 'test.pdf',
        fileUrl: 'https://storage.example.com/test.pdf',
        fileSize: 1024,
        mimeType: 'application/pdf',
        extractedText: null,
        uploadedAt: new Date(),
        processedAt: null,
        userId: mockUserId,
      };

      vi.mocked(prisma.sourceMaterial.findUnique).mockResolvedValue(mockDocument);
      vi.mocked(prisma.sourceMaterial.update).mockResolvedValue({
        ...mockDocument,
        extractedText: null,
        processedAt: new Date(),
      });

      // Mock fetch to fail
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
      });

      await expect(documentService.extractText(mockDocumentId)).rejects.toThrow(
        'Failed to extract text from document'
      );

      // Verify document was marked as processed even on failure
      expect(prisma.sourceMaterial.update).toHaveBeenCalledWith({
        where: { id: mockDocumentId },
        data: {
          extractedText: null,
          processedAt: expect.any(Date),
        },
      });
    });
  });

  describe('deleteDocument', () => {
    it('should delete document and file from storage', async () => {
      const mockDocument = {
        id: mockDocumentId,
        fileName: 'test.pdf',
        fileUrl: 'https://storage.example.com/test.pdf',
        fileSize: 1024,
        mimeType: 'application/pdf',
        extractedText: null,
        uploadedAt: new Date(),
        processedAt: null,
        userId: mockUserId,
      };

      vi.mocked(prisma.sourceMaterial.findFirst).mockResolvedValue(mockDocument);
      vi.mocked(fileUploadServer.deleteFileFromStorage).mockResolvedValue();
      vi.mocked(prisma.sourceMaterial.delete).mockResolvedValue(mockDocument);

      await documentService.deleteDocument(mockUserId, mockDocumentId);

      expect(prisma.sourceMaterial.findFirst).toHaveBeenCalledWith({
        where: {
          id: mockDocumentId,
          userId: mockUserId,
        },
      });
      expect(fileUploadServer.deleteFileFromStorage).toHaveBeenCalledWith(mockDocument.fileUrl);
      expect(prisma.sourceMaterial.delete).toHaveBeenCalledWith({
        where: {
          id: mockDocumentId,
        },
      });
    });

    it('should throw error if document not found', async () => {
      vi.mocked(prisma.sourceMaterial.findFirst).mockResolvedValue(null);

      await expect(
        documentService.deleteDocument(mockUserId, 'non-existent')
      ).rejects.toThrow('Document not found');

      expect(fileUploadServer.deleteFileFromStorage).not.toHaveBeenCalled();
      expect(prisma.sourceMaterial.delete).not.toHaveBeenCalled();
    });

    it('should throw error if user does not own document', async () => {
      vi.mocked(prisma.sourceMaterial.findFirst).mockResolvedValue(null);

      await expect(
        documentService.deleteDocument('other-user', mockDocumentId)
      ).rejects.toThrow('Document not found');

      expect(fileUploadServer.deleteFileFromStorage).not.toHaveBeenCalled();
      expect(prisma.sourceMaterial.delete).not.toHaveBeenCalled();
    });
  });
});
