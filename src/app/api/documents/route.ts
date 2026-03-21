import { NextRequest, NextResponse } from 'next/server';
import { User } from '@prisma/client';
import { requireAuth } from '@/middleware/auth';
import { withRateLimit } from '@/middleware/rateLimit';
import { documentService } from '@/lib/services/document.service';

// GET /api/documents - List all user documents
export const GET = withRateLimit(
  requireAuth(async (request: NextRequest, context, user: User) => {
    try {
      console.log('GET /api/documents called for user:', user.id);

      // Parse query parameters for tag filtering
      const { searchParams } = new URL(request.url);
      const tagsParam = searchParams.get('tags');
      const tags = tagsParam ? tagsParam.split(',').map(t => t.trim()) : undefined;

      const documents = await documentService.listDocuments(user.id, tags);

      console.log(`Found ${documents.length} documents for user`);
      return NextResponse.json({ documents });
    } catch (error) {
      console.error('Error fetching documents:', error);
      return NextResponse.json(
        {
          error: 'Failed to fetch documents',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 500 }
      );
    }
  }),
  'read'
);

// POST /api/documents/upload - Upload a document
export const POST = withRateLimit(
  requireAuth(async (request: NextRequest, context, user: User) => {
    try {
      console.log('POST /api/documents called for user:', user.id);

      // Parse multipart form data
      const formData = await request.formData();
      const file = formData.get('file') as File;
      const tagsParam = formData.get('tags') as string | null;

      console.log('File received:', file ? file.name : 'none');
      console.log('File type:', file ? file.type : 'none');
      console.log('File size:', file ? file.size : 0);

      if (!file) {
        return NextResponse.json(
          { error: 'No file provided' },
          { status: 400 }
        );
      }

      // Validate file type
      if (file.type !== 'application/pdf') {
        return NextResponse.json(
          { error: 'Only PDF files are supported' },
          { status: 400 }
        );
      }

      // Validate file size (50MB max)
      const maxSize = 50 * 1024 * 1024; // 50MB
      if (file.size > maxSize) {
        return NextResponse.json(
          { error: 'File size must be less than 50MB' },
          { status: 400 }
        );
      }

      console.log('File validation passed, converting to buffer...');

      // Convert file to buffer
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      console.log('Buffer created, size:', buffer.length);

      // Parse tags from comma-separated string or JSON array
      let tags: string[] = [];
      if (tagsParam) {
        try {
          // Try parsing as JSON array first
          tags = JSON.parse(tagsParam);
        } catch {
          // Fall back to comma-separated string
          tags = tagsParam.split(',').map(t => t.trim()).filter(t => t.length > 0);
        }
      }

      console.log('Uploading document to storage...');

      // Upload document
      const document = await documentService.uploadDocument(
        user.id,
        file.name,
        buffer,
        file.type,
        file.size,
        tags
      );

      console.log('Document uploaded successfully:', document.id);

      // Small delay to ensure file is fully written to disk (especially for local storage)
      await new Promise(resolve => setTimeout(resolve, 200));

      // Extract text from the uploaded PDF
      try {
        console.log('Starting text extraction for document:', document.id);
        await documentService.extractText(document.id);
        console.log('Text extraction completed for document:', document.id);
      } catch (error) {
        // Log extraction error but don't fail the upload
        console.error('Text extraction failed for document:', document.id);
        console.error('Extraction error details:', error instanceof Error ? error.message : error);
      }

      // Fetch the updated document with extracted text
      const updatedDocument = await documentService.getDocument(user.id, document.id);

      console.log('Returning document data to client');
      return NextResponse.json(updatedDocument, { status: 201 });
    } catch (error) {
      console.error('Error uploading document:', error);
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      return NextResponse.json(
        {
          error: 'Failed to upload document',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 500 }
      );
    }
  }),
  'write'
);
