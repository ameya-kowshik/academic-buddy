import { NextRequest } from 'next/server';
import { validatePdfBuffer } from './file-upload';
import admin from './firebase-admin';
import { uploadFileToLocalStorage, deleteFileFromLocalStorage } from './file-upload-local';

// Use local storage in development, Firebase in production
const USE_LOCAL_STORAGE = process.env.NODE_ENV === 'development' && !process.env.USE_FIREBASE_STORAGE;

/**
 * Extracts file from multipart form data in Next.js API route
 */
export async function extractFileFromRequest(
  request: NextRequest
): Promise<{ file: File; buffer: Buffer } | { error: string }> {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return { error: 'No file provided' };
    }

    // Convert File to Buffer for server-side processing
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    return { file, buffer };
  } catch (error) {
    console.error('Error extracting file from request:', error);
    return { error: 'Failed to process file upload' };
  }
}

/**
 * Validates and processes uploaded PDF file
 */
export async function processUploadedPdf(
  file: File,
  buffer: Buffer
): Promise<{ valid: true; data: { fileName: string; fileSize: number; mimeType: string } } | { valid: false; error: string }> {
  // Validate PDF
  const validation = validatePdfBuffer(buffer, file.type, file.size);
  
  if (!validation.valid) {
    return { valid: false, error: validation.error || 'Invalid file' };
  }

  return {
    valid: true,
    data: {
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
    },
  };
}

/**
 * Uploads file buffer to storage (Firebase or local based on environment)
 */
export async function uploadFileToStorage(
  userId: string,
  fileName: string,
  buffer: Buffer,
  mimeType: string
): Promise<string> {
  // Use local storage in development for easier debugging
  if (USE_LOCAL_STORAGE) {
    console.log('Using local file storage (development mode)');
    return uploadFileToLocalStorage(userId, fileName, buffer, mimeType);
  }
  
  // Use Firebase Storage in production
  console.log('Using Firebase Storage');
  try {
    const bucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
    
    if (!bucketName) {
      throw new Error('Firebase storage bucket not configured. Please set NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET environment variable.');
    }
    
    const bucket = admin.storage().bucket(bucketName);
    
    // Generate unique file path
    const timestamp = Date.now();
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const storagePath = `documents/${userId}/${timestamp}_${sanitizedFileName}`;
    
    // Create file reference
    const file = bucket.file(storagePath);
    
    // Upload buffer
    await file.save(buffer, {
      metadata: {
        contentType: mimeType,
        metadata: {
          uploadedBy: userId,
          originalName: fileName,
        },
      },
    });
    
    // Make file publicly accessible and get URL
    await file.makePublic();
    const publicUrl = `https://storage.googleapis.com/${bucketName}/${storagePath}`;
    
    return publicUrl;
  } catch (error) {
    console.error('Error uploading file to Firebase storage:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to upload file to Firebase storage: ${error.message}`);
    }
    throw new Error('Failed to upload file to Firebase storage');
  }
}

/**
 * Deletes a file from storage (Firebase or local based on environment)
 */
export async function deleteFileFromStorage(fileUrl: string): Promise<void> {
  console.log('[File Upload Server] Starting file deletion for URL:', fileUrl);
  
  // Use local storage in development or for local file paths
  if (USE_LOCAL_STORAGE || fileUrl.startsWith('/uploads/')) {
    console.log('[File Upload Server] Using local file storage for deletion');
    return deleteFileFromLocalStorage(fileUrl);
  }
  
  // Use Firebase Storage in production
  console.log('[File Upload Server] Using Firebase Storage for deletion');
  try {
    const bucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
    
    if (!bucketName) {
      console.error('[File Upload Server] Firebase storage bucket not configured');
      throw new Error('Firebase storage bucket not configured');
    }
    
    const bucket = admin.storage().bucket(bucketName);
    
    // Extract file path from URL
    const urlPattern = new RegExp(`https://storage.googleapis.com/${bucketName}/(.+)`);
    const match = fileUrl.match(urlPattern);
    
    if (!match || !match[1]) {
      console.error('[File Upload Server] Invalid Firebase Storage URL:', fileUrl);
      throw new Error('Invalid file URL');
    }
    
    const filePath = decodeURIComponent(match[1]);
    console.log('[File Upload Server] Extracted file path:', filePath);
    
    const file = bucket.file(filePath);
    
    // Check if file exists before deleting
    const [exists] = await file.exists();
    if (!exists) {
      console.warn('[File Upload Server] File does not exist in Firebase Storage, skipping deletion');
      return;
    }
    
    await file.delete();
    console.log('[File Upload Server] File deleted successfully from Firebase Storage');
  } catch (error) {
    console.error('[File Upload Server] Error deleting file from Firebase storage:', error);
    
    // Provide detailed error message
    if (error instanceof Error) {
      throw new Error(`Failed to delete file from Firebase storage: ${error.message}`);
    }
    throw new Error('Failed to delete file from Firebase storage: Unknown error');
  }
}
