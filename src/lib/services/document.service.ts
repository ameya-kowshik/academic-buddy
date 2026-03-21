import { prisma } from '@/lib/prisma';
import { SourceMaterial } from '@prisma/client';
import { uploadFileToStorage, deleteFileFromStorage } from '@/lib/file-upload-server';

/**
 * Service for managing document uploads and storage
 * Handles CRUD operations for SourceMaterial records
 */
export class DocumentService {
  /**
   * Upload a document and create SourceMaterial record
   * @param userId - User ID who owns the document
   * @param fileName - Original file name
   * @param buffer - File buffer
   * @param mimeType - MIME type of the file
   * @param fileSize - Size of the file in bytes
   * @param tags - Optional tags for categorization
   * @returns Created SourceMaterial record
   */
  async uploadDocument(
    userId: string,
    fileName: string,
    buffer: Buffer,
    mimeType: string,
    fileSize: number,
    tags: string[] = []
  ): Promise<SourceMaterial> {
    // Upload file to storage
    const fileUrl = await uploadFileToStorage(userId, fileName, buffer, mimeType);

    // Create SourceMaterial record
    const sourceMaterial = await prisma.sourceMaterial.create({
      data: {
        fileName,
        fileUrl,
        fileSize,
        mimeType,
        tags,
        userId,
      },
    });

    return sourceMaterial;
  }

  /**
   * Retrieve a document by ID with ownership check
   * @param userId - User ID requesting the document
   * @param documentId - Document ID to retrieve
   * @returns SourceMaterial record or null if not found/unauthorized
   */
  async getDocument(userId: string, documentId: string): Promise<SourceMaterial | null> {
    const document = await prisma.sourceMaterial.findFirst({
      where: {
        id: documentId,
        userId,
      },
    });

    return document;
  }

  /**
   * Retrieve all documents for a user
   * @param userId - User ID to retrieve documents for
   * @param tags - Optional tags to filter by
   * @returns Array of SourceMaterial records
   */
  async listDocuments(userId: string, tags?: string[]): Promise<SourceMaterial[]> {
    const documents = await prisma.sourceMaterial.findMany({
      where: {
        userId,
        ...(tags && tags.length > 0 ? { tags: { hasSome: tags } } : {}),
      },
      orderBy: {
        uploadedAt: 'desc',
      },
    });

    return documents;
  }

  /**
   * Extract text from a PDF document with retry logic
   * @param documentId - Document ID to extract text from
   * @param retryCount - Current retry attempt (internal use)
   * @returns Extracted text content
   */
  async extractText(documentId: string, retryCount: number = 0): Promise<string> {
    const MAX_RETRIES = 2;
    
    // Get document from database
    const document = await prisma.sourceMaterial.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      throw new Error('Document not found');
    }

    try {
      console.log(`[Text Extraction] Starting extraction for document ${documentId} (attempt ${retryCount + 1}/${MAX_RETRIES + 1})`);
      
      // Import pdf2json - Node.js native PDF parser
      const PDFParser = (await import('pdf2json')).default;
      console.log('[Text Extraction] Loaded pdf2json');

      let filePath: string;

      // Check if it's a local file path or remote URL
      if (document.fileUrl.startsWith('/uploads/')) {
        // Local file - use filesystem path
        const { join } = await import('path');
        const { existsSync } = await import('fs');
        
        filePath = join(process.cwd(), 'public', document.fileUrl);
        console.log('[Text Extraction] Using local file:', filePath);
        
        // Check if file exists
        if (!existsSync(filePath)) {
          throw new Error(`File not found at path: ${filePath}`);
        }
      } else {
        // Remote file - download first
        console.log('[Text Extraction] Downloading remote file:', document.fileUrl);
        const { writeFile, unlink } = await import('fs/promises');
        const { join } = await import('path');
        const { tmpdir } = await import('os');
        
        const response = await fetch(document.fileUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch document: ${response.status} ${response.statusText}`);
        }
        
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        
        // Save to temp file
        filePath = join(tmpdir(), `pdf-${documentId}.pdf`);
        await writeFile(filePath, buffer);
        console.log('[Text Extraction] Downloaded to temp file:', filePath);
      }

      console.log('[Text Extraction] Parsing PDF with pdf2json...');

      // Parse PDF using pdf2json
      const extractedText = await new Promise<string>((resolve, reject) => {
        const pdfParser = new PDFParser();
        
        pdfParser.on('pdfParser_dataError', (errData: any) => {
          console.error('[Text Extraction] PDF parsing error:', errData.parserError);
          reject(new Error(errData.parserError));
        });
        
        pdfParser.on('pdfParser_dataReady', (pdfData: any) => {
          try {
            // Extract text from all pages
            const pages = pdfData.Pages || [];
            const textParts: string[] = [];
            
            pages.forEach((page: any, pageIndex: number) => {
              const texts = page.Texts || [];
              const pageTexts: string[] = [];
              
              texts.forEach((text: any) => {
                const decodedText = decodeURIComponent(text.R[0].T);
                pageTexts.push(decodedText);
              });
              
              if (pageTexts.length > 0) {
                textParts.push(pageTexts.join(' '));
              }
            });
            
            const fullText = textParts.join('\n\n');
            console.log('[Text Extraction] Extraction successful');
            console.log('[Text Extraction] Text length:', fullText.length, 'characters');
            console.log('[Text Extraction] Pages:', pages.length);
            
            resolve(fullText);
          } catch (error) {
            console.error('[Text Extraction] Error processing PDF data:', error);
            reject(error);
          }
        });
        
        // Load PDF file
        pdfParser.loadPDF(filePath);
      });

      // Update the SourceMaterial record with extracted text and processedAt timestamp
      await prisma.sourceMaterial.update({
        where: { id: documentId },
        data: {
          extractedText,
          processedAt: new Date(),
        },
      });

      console.log('[Text Extraction] Database updated successfully');
      return extractedText;
      
    } catch (error) {
      console.error('[Text Extraction] Error occurred:', error);
      
      // Retry logic
      if (retryCount < MAX_RETRIES) {
        console.log(`[Text Extraction] Retrying... (${retryCount + 1}/${MAX_RETRIES})`);
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1))); // Exponential backoff
        return this.extractText(documentId, retryCount + 1);
      }
      
      // Max retries reached - mark as processed with failure
      console.error('[Text Extraction] Max retries reached, marking as failed');
      await prisma.sourceMaterial.update({
        where: { id: documentId },
        data: {
          extractedText: null,
          processedAt: new Date(),
        },
      });

      // Provide detailed error message
      let errorMessage = 'Unknown error';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      throw new Error(`Failed to extract text after ${MAX_RETRIES + 1} attempts: ${errorMessage}`);
    }
  }

  /**
   * Delete a document and its file from storage
   * @param userId - User ID requesting deletion
   * @param documentId - Document ID to delete
   * @throws Error if document not found or unauthorized
   */
  async deleteDocument(userId: string, documentId: string): Promise<void> {
    console.log(`[Document Service] Starting deletion for document ${documentId}`);
    
    // Find document with ownership check
    const document = await prisma.sourceMaterial.findFirst({
      where: {
        id: documentId,
        userId,
      },
    });

    if (!document) {
      console.error(`[Document Service] Document not found or unauthorized: ${documentId}`);
      throw new Error('Document not found');
    }

    console.log(`[Document Service] Document found: ${document.fileName}`);
    console.log(`[Document Service] File URL: ${document.fileUrl}`);

    try {
      // Delete file from storage first (before database deletion)
      console.log('[Document Service] Deleting file from storage...');
      await deleteFileFromStorage(document.fileUrl);
      console.log('[Document Service] File deleted successfully from storage');
    } catch (error) {
      // Log error but continue with database deletion
      // This handles cases where file might already be deleted or doesn't exist
      console.warn('[Document Service] Failed to delete file from storage:', error);
      console.warn('[Document Service] Continuing with database deletion...');
    }

    try {
      // Delete database record
      console.log('[Document Service] Deleting database record...');
      await prisma.sourceMaterial.delete({
        where: {
          id: documentId,
        },
      });
      console.log('[Document Service] Database record deleted successfully');
    } catch (error) {
      console.error('[Document Service] Failed to delete database record:', error);
      throw new Error('Failed to delete document from database');
    }

    console.log(`[Document Service] Document deletion completed: ${documentId}`);
  }

  /**
   * Update document tags
   * @param userId - User ID requesting update
   * @param documentId - Document ID to update
   * @param tags - New tags array
   * @returns Updated SourceMaterial record
   * @throws Error if document not found or unauthorized
   */
  async updateDocumentTags(userId: string, documentId: string, tags: string[]): Promise<SourceMaterial> {
    // Find document with ownership check
    const document = await prisma.sourceMaterial.findFirst({
      where: {
        id: documentId,
        userId,
      },
    });

    if (!document) {
      throw new Error('Document not found');
    }

    // Update tags
    const updatedDocument = await prisma.sourceMaterial.update({
      where: {
        id: documentId,
      },
      data: {
        tags,
      },
    });

    return updatedDocument;
  }
}

// Export singleton instance
export const documentService = new DocumentService();
