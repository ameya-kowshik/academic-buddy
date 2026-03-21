# Document Upload Infrastructure

This directory contains utilities for handling PDF document uploads in the Academic Buddy study tools feature.

## Files

### `file-upload.ts`
Client-side file upload utilities for use in React components.

**Functions:**
- `validatePdfFile(file: File)` - Validates PDF files on the client side
- `uploadPdfFile(userId: string, file: File)` - Uploads PDF to Firebase Storage
- `deleteFile(fileUrl: string)` - Deletes file from Firebase Storage
- `validatePdfBuffer(buffer: Buffer, mimeType: string, size: number)` - Server-side validation

**Validation Rules:**
- Only PDF files (MIME type: `application/pdf`)
- Maximum file size: 50MB
- PDF magic number validation (server-side)

### `file-upload-server.ts`
Server-side file upload utilities for use in API routes.

**Functions:**
- `extractFileFromRequest(request: NextRequest)` - Extracts file from multipart form data
- `processUploadedPdf(file: File, buffer: Buffer)` - Validates and processes uploaded PDF
- `uploadFileToStorage(userId: string, fileName: string, buffer: Buffer, mimeType: string)` - Uploads to Firebase Storage using Admin SDK
- `deleteFileFromStorage(fileUrl: string)` - Deletes file using Admin SDK

## Storage Configuration

Files are stored in Firebase Storage with the following structure:
```
documents/
  {userId}/
    {timestamp}_{sanitized_filename}.pdf
```

## Usage Examples

### Client-Side Upload

```typescript
import { validatePdfFile, uploadPdfFile } from '@/lib/file-upload';

async function handleFileUpload(file: File, userId: string) {
  // Validate file
  const validation = validatePdfFile(file);
  if (!validation.valid) {
    console.error(validation.error);
    return;
  }

  // Upload file
  try {
    const result = await uploadPdfFile(userId, file);
    console.log('File uploaded:', result.fileUrl);
  } catch (error) {
    console.error('Upload failed:', error);
  }
}
```

### Server-Side Upload (API Route)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { extractFileFromRequest, processUploadedPdf, uploadFileToStorage } from '@/lib/file-upload-server';

export async function POST(request: NextRequest) {
  // Extract file from request
  const fileData = await extractFileFromRequest(request);
  if ('error' in fileData) {
    return NextResponse.json({ error: fileData.error }, { status: 400 });
  }

  // Validate and process
  const validation = await processUploadedPdf(fileData.file, fileData.buffer);
  if (!validation.valid) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  // Upload to storage
  const userId = 'user-id'; // Get from auth
  const fileUrl = await uploadFileToStorage(
    userId,
    validation.data.fileName,
    fileData.buffer,
    validation.data.mimeType
  );

  return NextResponse.json({ fileUrl });
}
```

## Schema Validation

Use the Zod schema for additional validation:

```typescript
import { documentUploadSchema } from '@/schemas/document.schema';

const result = documentUploadSchema.safeParse({
  fileName: 'document.pdf',
  fileSize: 1024 * 1024,
  mimeType: 'application/pdf',
});

if (!result.success) {
  console.error(result.error.issues);
}
```

## Testing

Run tests with:
```bash
npm test
```

Tests are located in:
- `src/lib/__tests__/file-upload.test.ts`
- `src/schemas/__tests__/document.schema.test.ts`

## Requirements Satisfied

This infrastructure satisfies the following requirements from the study-tools spec:
- **Requirement 1.1**: Document upload and storage
- **Requirement 1.2**: Metadata recording (file name, size, MIME type, timestamp)
- **Requirement 1.4**: PDF file validation

## Next Steps

The following features will be implemented in subsequent tasks:
- Text extraction from PDFs (Requirement 2.1-2.5)
- Document management API routes
- Document service layer
- UI components for document upload
